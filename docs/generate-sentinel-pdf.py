#!/usr/bin/env python3
"""Generate Sentinel/Centinela System Documentation PDF"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether
)

# Colors
GREEN = HexColor('#4ADE80')
DARK_BG = HexColor('#0B0F14')
DARK_CARD = HexColor('#141B24')
GRAY_TEXT = HexColor('#94A3B8')
WHITE_TEXT = HexColor('#E5E7EB')
ACCENT_CYAN = HexColor('#22D3EE')
ACCENT_RED = HexColor('#FB7185')
ACCENT_YELLOW = HexColor('#FCD34D')
BORDER_COLOR = HexColor('#1E293B')
TABLE_HEADER_BG = HexColor('#1A2332')
TABLE_ROW_BG = HexColor('#0F1620')
TABLE_ALT_BG = HexColor('#131D2A')

def build_pdf():
    doc = SimpleDocTemplate(
        "docs/SENTINEL_SYSTEM_REPORT.pdf",
        pagesize=letter,
        topMargin=0.6*inch,
        bottomMargin=0.6*inch,
        leftMargin=0.7*inch,
        rightMargin=0.7*inch,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    styles.add(ParagraphStyle(
        'DocTitle', parent=styles['Title'],
        fontSize=26, leading=32, textColor=GREEN,
        spaceAfter=6, fontName='Helvetica-Bold',
    ))
    styles.add(ParagraphStyle(
        'DocSubtitle', parent=styles['Normal'],
        fontSize=12, leading=16, textColor=GRAY_TEXT,
        spaceAfter=20, fontName='Helvetica',
    ))
    styles.add(ParagraphStyle(
        'SectionTitle', parent=styles['Heading1'],
        fontSize=18, leading=24, textColor=GREEN,
        spaceBefore=24, spaceAfter=10, fontName='Helvetica-Bold',
        borderWidth=0, borderColor=GREEN, borderPadding=0,
    ))
    styles.add(ParagraphStyle(
        'SubSection', parent=styles['Heading2'],
        fontSize=14, leading=18, textColor=ACCENT_CYAN,
        spaceBefore=16, spaceAfter=8, fontName='Helvetica-Bold',
    ))
    styles.add(ParagraphStyle(
        'Body', parent=styles['Normal'],
        fontSize=10, leading=14, textColor=HexColor('#CBD5E1'),
        spaceAfter=8, fontName='Helvetica',
    ))
    styles.add(ParagraphStyle(
        'BodyBold', parent=styles['Normal'],
        fontSize=10, leading=14, textColor=WHITE_TEXT,
        spaceAfter=8, fontName='Helvetica-Bold',
    ))
    styles.add(ParagraphStyle(
        'Mono', parent=styles['Normal'],
        fontSize=9, leading=13, textColor=HexColor('#A5F3FC'),
        fontName='Courier', spaceAfter=6,
        leftIndent=12,
    ))
    styles.add(ParagraphStyle(
        'BulletCustom', parent=styles['Normal'],
        fontSize=10, leading=14, textColor=HexColor('#CBD5E1'),
        fontName='Helvetica', spaceAfter=4,
        leftIndent=20, bulletIndent=8,
    ))
    styles.add(ParagraphStyle(
        'SmallNote', parent=styles['Normal'],
        fontSize=8, leading=11, textColor=GRAY_TEXT,
        fontName='Helvetica-Oblique', spaceAfter=4,
    ))
    styles.add(ParagraphStyle(
        'TableHeader', parent=styles['Normal'],
        fontSize=9, leading=12, textColor=GREEN,
        fontName='Helvetica-Bold', alignment=TA_CENTER,
    ))
    styles.add(ParagraphStyle(
        'TableCell', parent=styles['Normal'],
        fontSize=8.5, leading=11, textColor=HexColor('#CBD5E1'),
        fontName='Helvetica',
    ))
    styles.add(ParagraphStyle(
        'TableCellCenter', parent=styles['Normal'],
        fontSize=8.5, leading=11, textColor=HexColor('#CBD5E1'),
        fontName='Helvetica', alignment=TA_CENTER,
    ))
    styles.add(ParagraphStyle(
        'Footer', parent=styles['Normal'],
        fontSize=8, textColor=GRAY_TEXT, alignment=TA_CENTER,
    ))

    story = []

    # ========== COVER ==========
    story.append(Spacer(1, 1.5*inch))
    story.append(Paragraph("SISTEMA CENTINELA", styles['DocTitle']))
    story.append(Paragraph("(Sentinel Validation Engine)", styles['DocSubtitle']))
    story.append(Spacer(1, 0.3*inch))
    story.append(Paragraph(
        "Reporte Tecnico Completo — Motor de Validacion de 27 Checks para Agentes ERC-8004",
        styles['Body']
    ))
    story.append(Spacer(1, 0.2*inch))

    # Info table
    info_data = [
        ['Plataforma', 'Enigma-prod (ERC-8004 Scanner)'],
        ['Red', 'Avalanche C-Chain (Mainnet 43114)'],
        ['Alojamiento', 'Vercel (mismo deploy que Enigma)'],
        ['Ejecucion', 'Cron cada hora + on-demand'],
        ['Creador', 'Cyber Paisa — Enigma Group'],
        ['Fecha', 'Marzo 2026'],
    ]
    info_table = Table(info_data, colWidths=[1.8*inch, 4.5*inch])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), TABLE_HEADER_BG),
        ('BACKGROUND', (1, 0), (1, -1), TABLE_ROW_BG),
        ('TEXTCOLOR', (0, 0), (0, -1), GREEN),
        ('TEXTCOLOR', (1, 0), (1, -1), WHITE_TEXT),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(info_table)

    story.append(PageBreak())

    # ========== TABLE OF CONTENTS ==========
    story.append(Paragraph("CONTENIDO", styles['SectionTitle']))
    toc_items = [
        "1. Que es el Centinela",
        "2. Arquitectura del Sistema",
        "3. Como se Activa — 3 Triggers",
        "4. Los 27 Checks — Detalle Completo",
        "5. Sistema de Puntuacion y Veredicto",
        "6. Flujo de Validacion Paso a Paso",
        "7. Integracion con Trust Score v2",
        "8. Base de Datos — Modelos",
        "9. Endpoints API",
        "10. Archivos del Sistema",
        "11. Estado Actual de los Agentes",
    ]
    for item in toc_items:
        story.append(Paragraph(item, styles['Body']))
    story.append(PageBreak())

    # ========== 1. QUE ES ==========
    story.append(Paragraph("1. QUE ES EL CENTINELA", styles['SectionTitle']))
    story.append(Paragraph(
        "<b>El Centinela NO es un agente externo.</b> Es un <b>motor de validacion interno</b> "
        "que vive dentro de Enigma-prod. Funciona como un inspector de calidad automatizado que "
        "revisa cada agente ERC-8004 registrado para verificar si es real, funcional y confiable.",
        styles['Body']
    ))
    story.append(Spacer(1, 6))
    story.append(Paragraph("Caracteristicas clave:", styles['BodyBold']))

    bullets = [
        "Ejecuta 27 verificaciones tecnicas sobre cada agente",
        "Corre automaticamente cada hora via Vercel Cron",
        "Evalua: metadata, infraestructura, pagos x402, seguridad",
        "Genera un veredicto: PASS, PARTIAL o FAIL",
        "Alimenta directamente el Trust Score v2 (35% del pilar Infrastructure)",
        "Actualiza el status del agente en la base de datos",
    ]
    for b in bullets:
        story.append(Paragraph(f"&bull;  {b}", styles['BulletCustom']))

    story.append(Spacer(1, 10))
    story.append(Paragraph(
        "En resumen: es el guardian automatico que garantiza que los agentes registrados "
        "en el ecosistema ERC-8004 realmente funcionan y cumplen con los estandares.",
        styles['Body']
    ))

    # ========== 2. ARQUITECTURA ==========
    story.append(Paragraph("2. ARQUITECTURA DEL SISTEMA", styles['SectionTitle']))
    story.append(Paragraph(
        "El Centinela se compone de 4 modulos especializados, todos dentro del directorio "
        "<font color='#A5F3FC'>src/services/centinela/</font> de Enigma-prod:",
        styles['Body']
    ))

    arch_data = [
        [Paragraph('<b>Modulo</b>', styles['TableHeader']),
         Paragraph('<b>Archivo</b>', styles['TableHeader']),
         Paragraph('<b>Funcion</b>', styles['TableHeader'])],
        [Paragraph('Validador Principal', styles['TableCell']),
         Paragraph('sentinel-validator.ts', styles['TableCell']),
         Paragraph('Motor de 27 checks, calcula puntaje y veredicto', styles['TableCell'])],
        [Paragraph('Heartbeat Service', styles['TableCell']),
         Paragraph('heartbeat-service.ts', styles['TableCell']),
         Paragraph('Monitoreo de vida on-chain via getCode()', styles['TableCell'])],
        [Paragraph('Proxy Detector', styles['TableCell']),
         Paragraph('proxy-detector.ts', styles['TableCell']),
         Paragraph('Detecta patrones EIP-1967 (Transparent, UUPS, Beacon)', styles['TableCell'])],
        [Paragraph('OZ Matcher', styles['TableCell']),
         Paragraph('oz-matcher.ts', styles['TableCell']),
         Paragraph('Compara bytecode con patrones OpenZeppelin', styles['TableCell'])],
    ]
    arch_table = Table(arch_data, colWidths=[1.5*inch, 1.8*inch, 3*inch])
    arch_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_BG),
        ('BACKGROUND', (0, 1), (-1, 1), TABLE_ROW_BG),
        ('BACKGROUND', (0, 2), (-1, 2), TABLE_ALT_BG),
        ('BACKGROUND', (0, 3), (-1, 3), TABLE_ROW_BG),
        ('BACKGROUND', (0, 4), (-1, 4), TABLE_ALT_BG),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(arch_table)

    story.append(Spacer(1, 12))
    story.append(Paragraph("Diagrama de Componentes:", styles['SubSection']))
    story.append(Paragraph(
        "ENIGMA-PROD (Next.js / Vercel)", styles['Mono']
    ))
    story.append(Paragraph(
        "  |-- src/services/centinela/", styles['Mono']
    ))
    story.append(Paragraph(
        "  |     |-- sentinel-validator.ts  ... Motor principal (27 checks)", styles['Mono']
    ))
    story.append(Paragraph(
        "  |     |-- heartbeat-service.ts   ... Pings on-chain", styles['Mono']
    ))
    story.append(Paragraph(
        "  |     |-- proxy-detector.ts      ... EIP-1967 analysis", styles['Mono']
    ))
    story.append(Paragraph(
        "  |     |-- oz-matcher.ts          ... OpenZeppelin bytecode", styles['Mono']
    ))
    story.append(Paragraph(
        "  |     |-- index.ts               ... Exports publicos", styles['Mono']
    ))
    story.append(Paragraph(
        "  |", styles['Mono']
    ))
    story.append(Paragraph(
        "  |-- src/app/api/cron/indexer/     ... Cron cada hora", styles['Mono']
    ))
    story.append(Paragraph(
        "  |-- src/app/api/v1/agents/[addr]/validate/  ... API", styles['Mono']
    ))
    story.append(Paragraph(
        "  |", styles['Mono']
    ))
    story.append(Paragraph(
        "  |-- PostgreSQL (Supabase)", styles['Mono']
    ))
    story.append(Paragraph(
        "        |-- sentinel_validations   ... Resultados", styles['Mono']
    ))
    story.append(Paragraph(
        "        |-- heartbeat_logs         ... Historial pings", styles['Mono']
    ))

    # ========== 3. TRIGGERS ==========
    story.append(PageBreak())
    story.append(Paragraph("3. COMO SE ACTIVA — 3 TRIGGERS", styles['SectionTitle']))

    # Trigger 1
    story.append(Paragraph("Trigger 1: Cron Automatico (cada hora)", styles['SubSection']))
    story.append(Paragraph(
        "Vercel ejecuta <font color='#A5F3FC'>GET /api/cron/indexer</font> cada hora. "
        "Este endpoint orquesta 7 pasos secuenciales, siendo el ultimo la validacion Sentinel:",
        styles['Body']
    ))
    steps = [
        "1. Sync agentes desde Routescan (descubrir nuevos)",
        "2. Refresh metadata de todos los agentes",
        "3. Sync volumenes de transacciones",
        "4. Sync ratings del ReputationRegistry",
        "5. Enviar heartbeats a todos los agentes VERIFIED",
        "6. Recalcular trust scores v1",
        "7. >> SENTINEL: validateAllAgents() — corre 27 checks por agente <<",
    ]
    for s in steps:
        color = '#4ADE80' if '>>' in s else '#CBD5E1'
        story.append(Paragraph(f"<font color='{color}'>{s}</font>", styles['BulletCustom']))

    story.append(Spacer(1, 8))
    story.append(Paragraph(
        "Los agentes se validan en batches de 5 para no sobrecargar. "
        "Timeout total: 300 segundos (5 minutos).",
        styles['SmallNote']
    ))

    # Trigger 2
    story.append(Paragraph("Trigger 2: Manual (on-demand)", styles['SubSection']))
    story.append(Paragraph(
        "<font color='#A5F3FC'>POST /api/v1/agents/:address/validate</font> — "
        "Requiere CRON_SECRET en produccion. Valida un solo agente inmediatamente.",
        styles['Body']
    ))

    # Trigger 3
    story.append(Paragraph("Trigger 3: Lectura pasiva (Enhanced Score)", styles['SubSection']))
    story.append(Paragraph(
        "<font color='#A5F3FC'>GET /api/v1/agents/:address/enhanced-score</font> — "
        "No ejecuta checks nuevos, solo lee el ultimo resultado de la DB e incluye "
        "sentinelScore y sentinelVerdict en la respuesta.",
        styles['Body']
    ))

    # ========== 4. LOS 27 CHECKS ==========
    story.append(PageBreak())
    story.append(Paragraph("4. LOS 27 CHECKS — DETALLE COMPLETO", styles['SectionTitle']))

    # METADATA CHECKS
    story.append(Paragraph("Categoria: METADATA (Checks 1-6) — Max 40 puntos", styles['SubSection']))
    meta_checks = [
        ['#', 'Check', 'Pts', 'Que Verifica'],
        ['1', 'AGENTURL_PARSEABLE *', '10', 'Metadata JSON descargable desde tokenURI'],
        ['2', 'METADATA_COMPLETE', '5', 'Campos: name, description, services, active, registrations'],
        ['3', 'TYPE_VALID', '5', 'Tipo ERC-8004 registration-v1 correcto'],
        ['4', 'REGISTRATIONS_MATCH', '10', 'Formato CAIP-10 valido (eip155:chainId:0x...)'],
        ['5', 'WALLET_CAIP10', '5', 'Wallet en formato CAIP-10'],
        ['6', 'X402_WALLET_REQUIRED', '5', 'Si x402=true, wallet debe estar declarada'],
    ]
    meta_t = _build_check_table(meta_checks, styles)
    story.append(meta_t)
    story.append(Paragraph("* = Check CRITICO. Si falla, PASS baja a PARTIAL.", styles['SmallNote']))

    # INFRASTRUCTURE CHECKS
    story.append(Spacer(1, 8))
    story.append(Paragraph("Categoria: INFRASTRUCTURE (Checks 7-14) — Max 35 puntos", styles['SubSection']))
    infra_checks = [
        ['#', 'Check', 'Pts', 'Que Verifica'],
        ['7', 'TLS_VALID *', '5', 'HTTPS funcional y conexion exitosa'],
        ['8', 'HEALTH_2XX *', '5', '/health retorna 200 en < 2 segundos'],
        ['9', 'LATENCY_P95_OK', '5', 'P95 de 5 pings < 2000ms'],
        ['10', 'ERROR_RATE_OK', '5', 'Tasa de errores 5xx < 5%'],
        ['11', 'A2A_CARD_ACCESSIBLE', '3', '/.well-known/agent-card.json existe'],
        ['12', 'A2A_CARD_VALID', '3', 'Card tiene name, description, skills'],
        ['13', 'MCP_ENDPOINT_OK', '4', 'POST /mcp responde (JSON-RPC)'],
        ['14', 'MCP_LISTTOOLS_OK', '5', 'tools/list retorna array de herramientas'],
    ]
    infra_t = _build_check_table(infra_checks, styles)
    story.append(infra_t)
    story.append(Paragraph("* = Check CRITICO.", styles['SmallNote']))

    # AWS CHECKS
    story.append(Spacer(1, 8))
    story.append(Paragraph("Categoria: AWS (Checks 15-22) — Max 25 puntos — TODOS N/A", styles['SubSection']))
    story.append(Paragraph(
        "Los 8 checks de AWS (EC2, ALB, CloudWatch, Logs, Security Groups, WAF) requieren "
        "credenciales AWS que no estan disponibles. Resultado: 0/25 puntos, pero <b>no penalizan</b> "
        "porque se excluyen del maxScore alcanzable.",
        styles['Body']
    ))
    aws_checks = [
        ['#', 'Check', 'Pts', 'Estado'],
        ['15', 'AWS_EC2_STATUS_OK', '5', 'N/A — Sin credenciales'],
        ['16', 'AWS_EC2_CPU_OK', '3', 'N/A'],
        ['17', 'AWS_ALB_TARGETS_HEALTHY', '5', 'N/A'],
        ['18', 'AWS_ALB_ERROR_RATE_OK', '3', 'N/A'],
        ['19', 'AWS_CLOUDWATCH_ALARMS_OK', '3', 'N/A'],
        ['20', 'AWS_LOGS_RECENT', '2', 'N/A'],
        ['21', 'AWS_SECURITY_GROUPS_OK', '2', 'N/A'],
        ['22', 'AWS_WAF_ENABLED', '2', 'N/A'],
    ]
    aws_t = _build_check_table(aws_checks, styles)
    story.append(aws_t)

    # X402 CHECKS
    story.append(PageBreak())
    story.append(Paragraph("Categoria: X402 PAYMENTS (Checks 23-24) — Max 10 puntos", styles['SubSection']))
    x402_checks = [
        ['#', 'Check', 'Pts', 'Que Verifica'],
        ['23', 'X402_CHALLENGE_OK', '5', 'Endpoint retorna HTTP 402 con headers de pago'],
        ['24', 'X402_WALLET_CONSISTENT', '5', 'Wallet de pago declarada en metadata'],
    ]
    x402_t = _build_check_table(x402_checks, styles)
    story.append(x402_t)
    story.append(Spacer(1, 4))
    story.append(Paragraph(
        "Descubrimiento x402: Escanea metadata.services[] buscando endpoints, prueba paths "
        "estandar (/api/signals, /api/premium, /a2a/guide), intenta GET y POST.",
        styles['SmallNote']
    ))

    # BONUS CHECKS
    story.append(Spacer(1, 8))
    story.append(Paragraph("Categoria: BONUS (Checks 25-27) — Max 10 puntos", styles['SubSection']))
    bonus_checks = [
        ['#', 'Check', 'Pts', 'Que Verifica'],
        ['25', 'FIRST_VALIDATION', '5', 'Primera validacion del agente (solo 1 vez)'],
        ['26', 'X402_VERIFIED', '3', 'Verificacion manual de pago (siempre 0)'],
        ['27', 'AWS_FULL_CHECKS', '2', 'Todos los AWS checks pasan (siempre 0)'],
    ]
    bonus_t = _build_check_table(bonus_checks, styles)
    story.append(bonus_t)

    # SUMMARY BOX
    story.append(Spacer(1, 16))
    story.append(Paragraph("Resumen de Puntuacion", styles['SubSection']))
    summary_data = [
        ['Categoria', 'Max Teorico', 'Alcanzable', 'Checks'],
        ['Metadata', '40 pts', '40 pts', '6 checks'],
        ['Infrastructure', '35 pts', '35 pts', '8 checks'],
        ['AWS', '25 pts', '0 pts (N/A)', '8 checks'],
        ['x402 Payments', '10 pts', '10 pts', '2 checks'],
        ['Bonus', '10 pts', '0-5 pts', '3 checks'],
        ['TOTAL', '120 pts', '85-90 pts', '27 checks'],
    ]
    sum_t = Table(summary_data, colWidths=[1.8*inch, 1.3*inch, 1.5*inch, 1.3*inch])
    sum_t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_BG),
        ('TEXTCOLOR', (0, 0), (-1, 0), GREEN),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('TEXTCOLOR', (0, 1), (-1, -2), HexColor('#CBD5E1')),
        ('BACKGROUND', (0, -1), (-1, -1), HexColor('#1A3320')),
        ('TEXTCOLOR', (0, -1), (-1, -1), GREEN),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        *[('BACKGROUND', (0, i), (-1, i), TABLE_ROW_BG if i % 2 == 1 else TABLE_ALT_BG)
          for i in range(1, 6)],
    ]))
    story.append(sum_t)

    # ========== 5. SCORING ==========
    story.append(PageBreak())
    story.append(Paragraph("5. SISTEMA DE PUNTUACION Y VEREDICTO", styles['SectionTitle']))

    story.append(Paragraph("Calculo del Veredicto:", styles['SubSection']))
    story.append(Paragraph(
        "porcentaje = (totalScore / maxScore) x 100",
        styles['Mono']
    ))
    story.append(Spacer(1, 8))

    verdict_data = [
        ['Veredicto', 'Rango', 'Efecto en Agente'],
        ['PASS', '>= 70%', 'Status -> VERIFIED'],
        ['PARTIAL', '40% - 69%', 'Status -> PENDING'],
        ['FAIL', '< 40%', 'Status -> PENDING'],
    ]
    v_t = Table(verdict_data, colWidths=[1.5*inch, 1.5*inch, 3*inch])
    v_t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_BG),
        ('TEXTCOLOR', (0, 0), (-1, 0), GREEN),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BACKGROUND', (0, 1), (-1, 1), HexColor('#0F2918')),
        ('TEXTCOLOR', (0, 1), (-1, 1), GREEN),
        ('BACKGROUND', (0, 2), (-1, 2), HexColor('#2A2400')),
        ('TEXTCOLOR', (0, 2), (-1, 2), ACCENT_YELLOW),
        ('BACKGROUND', (0, 3), (-1, 3), HexColor('#2A1015')),
        ('TEXTCOLOR', (0, 3), (-1, 3), ACCENT_RED),
        ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(v_t)

    story.append(Spacer(1, 10))
    story.append(Paragraph(
        "<b>Override Critico:</b> Si cualquier check CRITICO falla (#1 AGENTURL_PARSEABLE, "
        "#7 TLS_VALID, #8 HEALTH_2XX), el veredicto PASS baja automaticamente a PARTIAL, "
        "sin importar el puntaje total.",
        styles['Body']
    ))

    story.append(Spacer(1, 8))
    story.append(Paragraph("Ejemplo de calculo:", styles['SubSection']))
    story.append(Paragraph("Agente con todos los checks pasados:", styles['BodyBold']))
    story.append(Paragraph("  Metadata: 40 + Infra: 35 + x402: 10 + Bonus(first): 5 = 90 pts", styles['Mono']))
    story.append(Paragraph("  maxScore = 90 (excluye AWS N/A)", styles['Mono']))
    story.append(Paragraph("  porcentaje = (90/90) x 100 = 100%  ->  PASS", styles['Mono']))

    # ========== 6. FLUJO ==========
    story.append(PageBreak())
    story.append(Paragraph("6. FLUJO DE VALIDACION PASO A PASO", styles['SectionTitle']))

    flow_steps = [
        ("PASO 1: Cargar Agente",
         "Buscar en DB por address. Extraer metadata, services[], registrations[]."),
        ("PASO 2: Checks de Metadata (secuencial)",
         "Check 1 es critico: si no descarga metadata, falla. "
         "Si pasa, extrae baseURL de services[] y ejecuta checks 2-6."),
        ("PASO 3: Checks de Infraestructura (paralelo)",
         "8 checks ejecutados en paralelo contra la baseURL del agente: "
         "TLS, health, latencia, errores, A2A card, MCP endpoint."),
        ("PASO 4: Checks AWS",
         "8 checks — todos retornan N/A (sin credenciales AWS). 0 puntos, no penalizan."),
        ("PASO 5: Checks x402",
         "Si x402 habilitado: buscar endpoint que retorne HTTP 402 con headers de pago. "
         "Prueba multiples paths con GET y POST."),
        ("PASO 6: Calcular Puntaje",
         "Sumar puntos de todos los checks. Calcular maxScore (excluir N/A). "
         "Determinar veredicto segun porcentaje. Aplicar override critico si aplica."),
        ("PASO 7: Guardar Resultado",
         "INSERT en sentinel_validations con score, veredicto, y JSON de 27 checks. "
         "UPDATE agents SET status segun veredicto."),
    ]
    for title, desc in flow_steps:
        story.append(Paragraph(title, styles['BodyBold']))
        story.append(Paragraph(desc, styles['Body']))
        story.append(Spacer(1, 4))

    # ========== 7. TRUST SCORE V2 ==========
    story.append(PageBreak())
    story.append(Paragraph("7. INTEGRACION CON TRUST SCORE V2", styles['SectionTitle']))

    story.append(Paragraph(
        "El Sentinel es la senal mas fuerte dentro del pilar Infrastructure del Trust Score v2. "
        "Su peso es <b>35%</b> dentro de Infrastructure, que a su vez vale <b>50%</b> del score final.",
        styles['Body']
    ))

    story.append(Spacer(1, 8))
    story.append(Paragraph("Formula del Trust Score v2:", styles['SubSection']))
    story.append(Paragraph(
        "v2 = Infrastructure(50%) + Community(20%) + Correlation(15%) + RL(15%)",
        styles['Mono']
    ))
    story.append(Spacer(1, 8))
    story.append(Paragraph("Desglose de Infrastructure:", styles['SubSection']))

    infra_weights = [
        ['Componente', 'Peso', 'Fuente'],
        ['SENTINEL', '35%', 'sentinel-validator.ts (normalizado 0-100)'],
        ['Uptime v1', '20%', 'heartbeat-service.ts'],
        ['Reliability TRACER', '20%', 'tracer-score-service.ts'],
        ['Proxy Detection', '15%', 'proxy-detector.ts'],
        ['OZ Bytecode Match', '10%', 'oz-matcher.ts'],
    ]
    iw_t = Table(infra_weights, colWidths=[1.5*inch, 0.8*inch, 3.8*inch])
    iw_t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_BG),
        ('TEXTCOLOR', (0, 0), (-1, 0), GREEN),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BACKGROUND', (0, 1), (-1, 1), HexColor('#1A3320')),
        ('TEXTCOLOR', (0, 1), (-1, 1), GREEN),
        ('FONTNAME', (0, 1), (-1, 1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (0, 2), (-1, -1), HexColor('#CBD5E1')),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (1, 0), (1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        *[('BACKGROUND', (0, i), (-1, i), TABLE_ROW_BG if i % 2 == 0 else TABLE_ALT_BG)
          for i in range(2, 6)],
    ]))
    story.append(iw_t)

    story.append(Spacer(1, 12))
    story.append(Paragraph(
        "<b>Impacto maximo del Sentinel en el score final:</b> "
        "35% x 50% = <font color='#4ADE80'><b>17.5 puntos porcentuales</b></font> del v2 total.",
        styles['Body']
    ))

    # ========== 8. DATABASE ==========
    story.append(Spacer(1, 16))
    story.append(Paragraph("8. BASE DE DATOS — MODELOS", styles['SectionTitle']))

    story.append(Paragraph("Tabla: sentinel_validations", styles['SubSection']))
    db1_data = [
        ['Campo', 'Tipo', 'Descripcion'],
        ['id', 'String (UUID)', 'Identificador unico'],
        ['agentAddress', 'String', 'Address del agente validado'],
        ['totalScore', 'Int (0-120)', 'Puntaje total obtenido'],
        ['maxScore', 'Int', 'Puntaje maximo alcanzable'],
        ['verdict', 'PASS|PARTIAL|FAIL', 'Veredicto final'],
        ['metadataScore', 'Int (0-40)', 'Score categoria metadata'],
        ['infrastructureScore', 'Int (0-35)', 'Score categoria infra'],
        ['awsScore', 'Int (0-25)', 'Score AWS (siempre 0)'],
        ['x402Score', 'Int (0-10)', 'Score x402 payments'],
        ['bonusScore', 'Int (0-10)', 'Score bonificaciones'],
        ['checks', 'JSON', 'Array con 27 CheckResult detallados'],
        ['createdAt', 'DateTime', 'Timestamp de validacion'],
    ]
    db1_t = _build_check_table(db1_data, styles)
    story.append(db1_t)

    story.append(Spacer(1, 12))
    story.append(Paragraph("Tabla: heartbeat_logs", styles['SubSection']))
    db2_data = [
        ['Campo', 'Tipo', 'Descripcion'],
        ['id', 'Int (auto)', 'ID secuencial'],
        ['agentAddress', 'String', 'Address del agente'],
        ['timestamp', 'DateTime', 'Cuando se envio'],
        ['challengeType', 'PING|CHALLENGE', 'Tipo de heartbeat'],
        ['responseTimeMs', 'Int|null', 'Tiempo de respuesta (null=timeout)'],
        ['result', 'PASS|FAIL|TIMEOUT', 'Resultado del ping'],
        ['errorMessage', 'String|null', 'Mensaje de error si fallo'],
    ]
    db2_t = _build_check_table(db2_data, styles)
    story.append(db2_t)

    # ========== 9. API ENDPOINTS ==========
    story.append(PageBreak())
    story.append(Paragraph("9. ENDPOINTS API", styles['SectionTitle']))

    api_data = [
        ['Metodo', 'Endpoint', 'Descripcion'],
        ['GET', '/api/v1/agents/:addr/validate', 'Leer ultima validacion'],
        ['POST', '/api/v1/agents/:addr/validate', 'Ejecutar validacion (requiere CRON_SECRET)'],
        ['GET', '/api/v1/agents/:addr/enhanced-score', 'Trust Score v2 con sentinel incluido'],
        ['GET', '/api/v1/agents/:addr/heartbeats', 'Historial de heartbeats + uptime %'],
        ['GET', '/api/cron/indexer', 'Cron: ejecuta todo (incluye Sentinel)'],
    ]
    api_t = Table(api_data, colWidths=[0.7*inch, 2.8*inch, 2.8*inch])
    api_t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_BG),
        ('TEXTCOLOR', (0, 0), (-1, 0), GREEN),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('TEXTCOLOR', (0, 1), (-1, -1), HexColor('#CBD5E1')),
        ('TEXTCOLOR', (0, 1), (0, -1), ACCENT_CYAN),
        ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        *[('BACKGROUND', (0, i), (-1, i), TABLE_ROW_BG if i % 2 == 1 else TABLE_ALT_BG)
          for i in range(1, 6)],
    ]))
    story.append(api_t)

    story.append(Spacer(1, 12))
    story.append(Paragraph("Ejemplo de respuesta GET /validate:", styles['SubSection']))
    story.append(Paragraph('{', styles['Mono']))
    story.append(Paragraph('  "agentAddress": "0x...",', styles['Mono']))
    story.append(Paragraph('  "totalScore": 85,', styles['Mono']))
    story.append(Paragraph('  "maxScore": 85,', styles['Mono']))
    story.append(Paragraph('  "verdict": "PASS",', styles['Mono']))
    story.append(Paragraph('  "categories": {', styles['Mono']))
    story.append(Paragraph('    "metadata": 40, "infrastructure": 35,', styles['Mono']))
    story.append(Paragraph('    "aws": 0, "x402": 10, "bonus": 0', styles['Mono']))
    story.append(Paragraph('  },', styles['Mono']))
    story.append(Paragraph('  "checks": [ ... 27 CheckResult objects ... ]', styles['Mono']))
    story.append(Paragraph('}', styles['Mono']))

    # ========== 10. ARCHIVOS ==========
    story.append(Spacer(1, 16))
    story.append(Paragraph("10. INVENTARIO DE ARCHIVOS", styles['SectionTitle']))

    files_data = [
        ['Archivo', 'Ubicacion', 'Lineas'],
        ['sentinel-validator.ts', 'src/services/centinela/', '~1,300'],
        ['heartbeat-service.ts', 'src/services/centinela/', '~364'],
        ['proxy-detector.ts', 'src/services/centinela/', '~220'],
        ['oz-matcher.ts', 'src/services/centinela/', '~382'],
        ['index.ts', 'src/services/centinela/', '~30'],
        ['validate/route.ts', 'src/app/api/v1/agents/[address]/', '~108'],
        ['enhanced-score/route.ts', 'src/app/api/v1/agents/[address]/', '~68'],
        ['heartbeats/route.ts', 'src/app/api/v1/agents/[address]/', '~129'],
        ['indexer/route.ts', 'src/app/api/cron/', '~122'],
        ['combined-trust-score-service.ts', 'src/services/', '~410'],
    ]
    f_t = Table(files_data, colWidths=[2.3*inch, 2.5*inch, 0.8*inch])
    f_t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_BG),
        ('TEXTCOLOR', (0, 0), (-1, 0), GREEN),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8.5),
        ('TEXTCOLOR', (0, 1), (-1, -1), HexColor('#CBD5E1')),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (2, 0), (2, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        *[('BACKGROUND', (0, i), (-1, i), TABLE_ROW_BG if i % 2 == 1 else TABLE_ALT_BG)
          for i in range(1, 11)],
    ]))
    story.append(f_t)

    # ========== 11. ESTADO ACTUAL ==========
    story.append(PageBreak())
    story.append(Paragraph("11. ESTADO ACTUAL DE LOS AGENTES", styles['SectionTitle']))
    story.append(Paragraph("Fecha: Marzo 1, 2026", styles['SmallNote']))
    story.append(Spacer(1, 8))

    status_data = [
        ['Agente', 'ID', 'Sentinel Score', 'Veredicto', 'v2 Score'],
        ['Apex Arbitrage', '#1687', '85/85 (100%)', 'PASS', '69'],
        ['AvaBuilder', '#1686', '85/85 (100%)', 'PASS', '68'],
    ]
    s_t = Table(status_data, colWidths=[1.5*inch, 0.7*inch, 1.3*inch, 1*inch, 0.8*inch])
    s_t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_BG),
        ('TEXTCOLOR', (0, 0), (-1, 0), GREEN),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BACKGROUND', (0, 1), (-1, -1), HexColor('#0F2918')),
        ('TEXTCOLOR', (0, 1), (-1, -1), GREEN),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(s_t)

    story.append(Spacer(1, 12))
    story.append(Paragraph(
        "Ambos agentes pasaron todos los checks alcanzables (AWS = N/A, no penaliza). "
        "Los cuellos de botella del v2 score son Infrastructure (65/100) y Correlation (39/100), "
        "que mejoraran con mas heartbeats, volumen de transacciones y tiempo.",
        styles['Body']
    ))

    story.append(Spacer(1, 24))
    story.append(Paragraph(
        "Resumen en una frase:", styles['SubSection']
    ))
    story.append(Paragraph(
        "El Centinela es un inspector automatico interno de Enigma que corre cada hora, "
        "ejecuta 27 verificaciones tecnicas sobre cada agente (metadata, infraestructura, "
        "pagos x402), y su resultado es la senal mas fuerte (35%) dentro del pilar de "
        "Infrastructure del Trust Score v2.",
        styles['Body']
    ))

    # ========== FOOTER ==========
    story.append(Spacer(1, 0.5*inch))
    story.append(Paragraph(
        "Enigma Platform — Cyber Paisa — Enigma Group — Marzo 2026",
        styles['Footer']
    ))

    # Build
    doc.build(story)
    print("PDF generado: docs/SENTINEL_SYSTEM_REPORT.pdf")


def _build_check_table(data, styles):
    """Build a styled table for checks."""
    col_count = len(data[0])
    if col_count == 4:
        widths = [0.4*inch, 2.2*inch, 0.5*inch, 3.2*inch]
    elif col_count == 3:
        widths = [2*inch, 2*inch, 2.3*inch]
    else:
        widths = [6.3*inch / col_count] * col_count

    t = Table(data, colWidths=widths)
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_BG),
        ('TEXTCOLOR', (0, 0), (-1, 0), GREEN),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8.5),
        ('TEXTCOLOR', (0, 1), (-1, -1), HexColor('#CBD5E1')),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]
    # Alternate row colors
    for i in range(1, len(data)):
        bg = TABLE_ROW_BG if i % 2 == 1 else TABLE_ALT_BG
        style_cmds.append(('BACKGROUND', (0, i), (-1, i), bg))

    t.setStyle(TableStyle(style_cmds))
    return t


if __name__ == '__main__':
    build_pdf()
