SISTEMA CENTINELA

(Sentinel Validation Engine)

Reporte Tecnico Completo — Motor de Validacion de 27 Checks para Agentes ERC-8004

Plataforma

Enigma-prod (ERC-8004 Scanner)

Red

Avalanche C-Chain (Mainnet 43114)

Alojamiento

Vercel (mismo deploy que Enigma)

Ejecucion

Cron cada hora + on-demand

Creador

Cyber Paisa — Enigma Group

Fecha

Marzo 2026

CONTENIDO

1. Que es el Centinela

2. Arquitectura del Sistema

3. Como se Activa — 3 Triggers

4. Los 27 Checks — Detalle Completo

5. Sistema de Puntuacion y Veredicto

6. Flujo de Validacion Paso a Paso

7. Integracion con Trust Score v2

8. Base de Datos — Modelos

9. Endpoints API

10. Archivos del Sistema

11. Estado Actual de los Agentes

1. QUE ES EL CENTINELA

El Centinela NO es un agente externo. Es un motor de validacion interno que vive dentro de Enigma-prod.
Funciona como un inspector de calidad automatizado que revisa cada agente ERC-8004 registrado para verificar
si es real, funcional y confiable.

Caracteristicas clave:

(cid:127) Ejecuta 27 verificaciones tecnicas sobre cada agente

(cid:127) Corre automaticamente cada hora via Vercel Cron

(cid:127) Evalua: metadata, infraestructura, pagos x402, seguridad

(cid:127) Genera un veredicto: PASS, PARTIAL o FAIL

(cid:127) Alimenta directamente el Trust Score v2 (35% del pilar Infrastructure)

(cid:127) Actualiza el status del agente en la base de datos

En resumen: es el guardian automatico que garantiza que los agentes registrados en el ecosistema ERC-8004
realmente funcionan y cumplen con los estandares.

2. ARQUITECTURA DEL SISTEMA

El Centinela se compone de 4 modulos especializados, todos dentro del directorio src/services/centinela/ de
Enigma-prod:

Modulo

Archivo

Funcion

Validador Principal

sentinel-validator.ts

Motor de 27 checks, calcula puntaje y veredicto

Heartbeat Service

heartbeat-service.ts

Monitoreo de vida on-chain via getCode()

Proxy Detector

proxy-detector.ts

Detecta patrones EIP-1967 (Transparent, UUPS,
Beacon)

OZ Matcher

oz-matcher.ts

Compara bytecode con patrones OpenZeppelin

Diagrama de Componentes:

ENIGMA-PROD (Next.js / Vercel)

|-- src/services/centinela/

| |-- sentinel-validator.ts ... Motor principal (27 checks)

| |-- heartbeat-service.ts ... Pings on-chain

| |-- proxy-detector.ts ... EIP-1967 analysis

| |-- oz-matcher.ts ... OpenZeppelin bytecode

| |-- index.ts ... Exports publicos

|

|-- src/app/api/cron/indexer/ ... Cron cada hora

|-- src/app/api/v1/agents/[addr]/validate/ ... API

|

|-- PostgreSQL (Supabase)

|-- sentinel_validations ... Resultados

|-- heartbeat_logs ... Historial pings

3. COMO SE ACTIVA — 3 TRIGGERS

Trigger 1: Cron Automatico (cada hora)

Vercel ejecuta GET /api/cron/indexer cada hora. Este endpoint orquesta 7 pasos secuenciales, siendo el ultimo
la validacion Sentinel:

1. Sync agentes desde Routescan (descubrir nuevos)

2. Refresh metadata de todos los agentes

3. Sync volumenes de transacciones

4. Sync ratings del ReputationRegistry

5. Enviar heartbeats a todos los agentes VERIFIED

6. Recalcular trust scores v1

7. >> SENTINEL: validateAllAgents() — corre 27 checks por agente <<

Los agentes se validan en batches de 5 para no sobrecargar. Timeout total: 300 segundos (5 minutos).

Trigger 2: Manual (on-demand)

POST /api/v1/agents/:address/validate — Requiere CRON_SECRET en produccion. Valida un solo agente
inmediatamente.

Trigger 3: Lectura pasiva (Enhanced Score)

GET /api/v1/agents/:address/enhanced-score — No ejecuta checks nuevos, solo lee el ultimo resultado de la DB
e incluye sentinelScore y sentinelVerdict en la respuesta.

4. LOS 27 CHECKS — DETALLE COMPLETO

Categoria: METADATA (Checks 1-6) — Max 40 puntos

#

1

2

3

4

5

6

Check

Pts

Que Verifica

AGENTURL_PARSEABLE *

10

Metadata JSON descargable desde tokenURI

METADATA_COMPLETE

TYPE_VALID

5

5

Campos: name, description, services, active, registrations

Tipo ERC-8004 registration-v1 correcto

REGISTRATIONS_MATCH

10

Formato CAIP-10 valido (eip155:chainId:0x...)

WALLET_CAIP10

X402_WALLET_REQUIRED

5

5

Wallet en formato CAIP-10

Si x402=true, wallet debe estar declarada

* = Check CRITICO. Si falla, PASS baja a PARTIAL.

Categoria: INFRASTRUCTURE (Checks 7-14) — Max 35 puntos

#

7

8

9

10

11

12

13

14

Check

TLS_VALID *

HEALTH_2XX *

LATENCY_P95_OK

ERROR_RATE_OK

A2A_CARD_ACCESSIBLE

A2A_CARD_VALID

MCP_ENDPOINT_OK

MCP_LISTTOOLS_OK

* = Check CRITICO.

Pts

Que Verifica

5

5

5

5

3

3

4

5

HTTPS funcional y conexion exitosa

/health retorna 200 en < 2 segundos

P95 de 5 pings < 2000ms

Tasa de errores 5xx < 5%

/.well-known/agent-card.json existe

Card tiene name, description, skills

POST /mcp responde (JSON-RPC)

tools/list retorna array de herramientas

Categoria: AWS (Checks 15-22) — Max 25 puntos — TODOS N/A

Los 8 checks de AWS (EC2, ALB, CloudWatch, Logs, Security Groups, WAF) requieren credenciales AWS que
no estan disponibles. Resultado: 0/25 puntos, pero no penalizan porque se excluyen del maxScore alcanzable.

#

15

16

17

Check

Pts

Estado

AWS_EC2_STATUS_OK

AWS_EC2_CPU_OK

AWS_ALB_TARGETS_HEALTHY

5

3

5

N/A — Sin credenciales

N/A

N/A

18

19

20

21

22

AWS_ALB_ERROR_RATE_OK

AWS_CLOUDWATCH_ALARMS_OK

AWS_LOGS_RECENT

AWS_SECURITY_GROUPS_OK

AWS_WAF_ENABLED

3

3

2

2

2

N/A

N/A

N/A

N/A

N/A

Categoria: X402 PAYMENTS (Checks 23-24) — Max 10 puntos

#

23

24

Check

Pts

Que Verifica

X402_CHALLENGE_OK

X402_WALLET_CONSISTENT

5

5

Endpoint retorna HTTP 402 con headers de pago

Wallet de pago declarada en metadata

Descubrimiento x402: Escanea metadata.services[] buscando endpoints, prueba paths estandar (/api/signals, /api/premium, /a2a/guide),
intenta GET y POST.

Categoria: BONUS (Checks 25-27) — Max 10 puntos

#

25

26

27

Check

Pts

Que Verifica

FIRST_VALIDATION

X402_VERIFIED

AWS_FULL_CHECKS

5

3

2

Primera validacion del agente (solo 1 vez)

Verificacion manual de pago (siempre 0)

Todos los AWS checks pasan (siempre 0)

Resumen de Puntuacion

Categoria

Metadata

Infrastructure

AWS

x402 Payments

Bonus

TOTAL

Max Teorico

Alcanzable

40 pts

35 pts

25 pts

10 pts

10 pts

40 pts

35 pts

0 pts (N/A)

10 pts

0-5 pts

Checks

6 checks

8 checks

8 checks

2 checks

3 checks

120 pts

85-90 pts

27 checks

5. SISTEMA DE PUNTUACION Y VEREDICTO

Calculo del Veredicto:

porcentaje = (totalScore / maxScore) x 100

Veredicto

PASS

Rango

>= 70%

Efecto en Agente

Status -> VERIFIED

PARTIAL

40% - 69%

Status -> PENDING

FAIL

< 40%

Status -> PENDING

Override Critico: Si cualquier check CRITICO falla (#1 AGENTURL_PARSEABLE, #7 TLS_VALID, #8
HEALTH_2XX), el veredicto PASS baja automaticamente a PARTIAL, sin importar el puntaje total.

Ejemplo de calculo:

Agente con todos los checks pasados:

Metadata: 40 + Infra: 35 + x402: 10 + Bonus(first): 5 = 90 pts

maxScore = 90 (excluye AWS N/A)

porcentaje = (90/90) x 100 = 100% -> PASS

6. FLUJO DE VALIDACION PASO A PASO

PASO 1: Cargar Agente

Buscar en DB por address. Extraer metadata, services[], registrations[].

PASO 2: Checks de Metadata (secuencial)

Check 1 es critico: si no descarga metadata, falla. Si pasa, extrae baseURL de services[] y ejecuta checks 2-6.

PASO 3: Checks de Infraestructura (paralelo)

8 checks ejecutados en paralelo contra la baseURL del agente: TLS, health, latencia, errores, A2A card, MCP
endpoint.

PASO 4: Checks AWS

8 checks — todos retornan N/A (sin credenciales AWS). 0 puntos, no penalizan.

PASO 5: Checks x402

Si x402 habilitado: buscar endpoint que retorne HTTP 402 con headers de pago. Prueba multiples paths con
GET y POST.

PASO 6: Calcular Puntaje

Sumar puntos de todos los checks. Calcular maxScore (excluir N/A). Determinar veredicto segun porcentaje.
Aplicar override critico si aplica.

PASO 7: Guardar Resultado

INSERT en sentinel_validations con score, veredicto, y JSON de 27 checks. UPDATE agents SET status segun
veredicto.

7. INTEGRACION CON TRUST SCORE V2

El Sentinel es la senal mas fuerte dentro del pilar Infrastructure del Trust Score v2. Su peso es 35% dentro de
Infrastructure, que a su vez vale 50% del score final.

Formula del Trust Score v2:

v2 = Infrastructure(50%) + Community(20%) + Correlation(15%) + RL(15%)

Desglose de Infrastructure:

Componente

Peso

Fuente

SENTINEL

35%

sentinel-validator.ts (normalizado 0-100)

Uptime v1

20%

heartbeat-service.ts

Reliability TRACER

20%

tracer-score-service.ts

Proxy Detection

15%

proxy-detector.ts

OZ Bytecode Match

10%

oz-matcher.ts

Impacto maximo del Sentinel en el score final: 35% x 50% = 17.5 puntos porcentuales del v2 total.

8. BASE DE DATOS — MODELOS

Tabla: sentinel_validations

Campo

id

agentAddress

totalScore

maxScore

verdict

metadataScore

infrastructureScore

awsScore

x402Score

Tipo

Descripcion

String (UUID)

Identificador unico

String

Int (0-120)

Int

Address del agente validado

Puntaje total obtenido

Puntaje maximo alcanzable

PASS|PARTIAL|FAIL

Veredicto final

Int (0-40)

Int (0-35)

Int (0-25)

Int (0-10)

Score categoria metadata

Score categoria infra

Score AWS (siempre 0)

Score x402 payments

bonusScore

checks

createdAt

Tabla: heartbeat_logs

Campo

id

agentAddress

timestamp

Int (0-10)

JSON

DateTime

Tipo

Int (auto)

String

DateTime

Score bonificaciones

Array con 27 CheckResult detallados

Timestamp de validacion

Descripcion

ID secuencial

Address del agente

Cuando se envio

challengeType

PING|CHALLENGE

Tipo de heartbeat

responseTimeMs

Int|null

Tiempo de respuesta (null=timeout)

result

PASS|FAIL|TIMEOUT

Resultado del ping

errorMessage

String|null

Mensaje de error si fallo

9. ENDPOINTS API

Metodo

Endpoint

Descripcion

GET

/api/v1/agents/:addr/validate

Leer ultima validacion

POST

/api/v1/agents/:addr/validate

Ejecutar validacion (requiere CRON_SECRET)

GET

GET

GET

/api/v1/agents/:addr/enhanced-score

Trust Score v2 con sentinel incluido

/api/v1/agents/:addr/heartbeats

Historial de heartbeats + uptime %

/api/cron/indexer

Cron: ejecuta todo (incluye Sentinel)

Ejemplo de respuesta GET /validate:

{

"agentAddress": "0x...",

"totalScore": 85,

"maxScore": 85,

"verdict": "PASS",

"categories": {

"metadata": 40, "infrastructure": 35,

"aws": 0, "x402": 10, "bonus": 0

},

"checks": [ ... 27 CheckResult objects ... ]

}

10. INVENTARIO DE ARCHIVOS

Archivo

Ubicacion

sentinel-validator.ts

src/services/centinela/

heartbeat-service.ts

src/services/centinela/

proxy-detector.ts

src/services/centinela/

oz-matcher.ts

index.ts

src/services/centinela/

src/services/centinela/

validate/route.ts

src/app/api/v1/agents/[address]/

enhanced-score/route.ts

src/app/api/v1/agents/[address]/

Lineas

~1,300

~364

~220

~382

~30

~108

~68

heartbeats/route.ts

src/app/api/v1/agents/[address]/

indexer/route.ts

src/app/api/cron/

combined-trust-score-service.ts

src/services/

~129

~122

~410

11. ESTADO ACTUAL DE LOS AGENTES

Fecha: Marzo 1, 2026

Agente

ID

Sentinel Score

Veredicto

v2 Score

Apex Arbitrage

#1687

85/85 (100%)

PASS

AvaBuilder

#1686

85/85 (100%)

PASS

69

68

Ambos agentes pasaron todos los checks alcanzables (AWS = N/A, no penaliza). Los cuellos de botella del v2
score son Infrastructure (65/100) y Correlation (39/100), que mejoraran con mas heartbeats, volumen de
transacciones y tiempo.

Resumen en una frase:

El Centinela es un inspector automatico interno de Enigma que corre cada hora, ejecuta 27 verificaciones
tecnicas sobre cada agente (metadata, infraestructura, pagos x402), y su resultado es la senal mas fuerte (35%)
dentro del pilar de Infrastructure del Trust Score v2.

Enigma Platform — Cyber Paisa — Enigma Group — Marzo 2026

