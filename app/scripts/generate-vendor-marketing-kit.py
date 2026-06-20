from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, HRFlowable,
    Table, TableStyle, PageBreak, KeepTogether
)
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import Flowable
import os


# ── COLOUR PALETTE ──────────────────────────────────────────────────────────
CHARCOAL  = colors.HexColor('#1C1C1C')
DARK_GRAY = colors.HexColor('#444444')
MID_GRAY  = colors.HexColor('#888888')
LIGHT_BG  = colors.HexColor('#F6F5F2')
WHITE     = colors.white
GREEN     = colors.HexColor('#1D9E75')
GREEN_LT  = colors.HexColor('#EAF3DE')
GREEN_DK  = colors.HexColor('#27500A')
RED_LT    = colors.HexColor('#FCEBEB')
RED_DK    = colors.HexColor('#A32D2D')
RULE_CLR  = colors.HexColor('#D8D6D0')
ACCENT    = colors.HexColor('#1D9E75')
COVER_BG  = colors.HexColor('#0F2A1E')


# ── STYLES ───────────────────────────────────────────────────────────────────
def make_styles():
    s = {}

    s['cover_tag'] = ParagraphStyle('cover_tag',
        fontName='Helvetica', fontSize=9, textColor=GREEN,
        spaceAfter=6, letterSpacing=1.5, alignment=TA_LEFT)

    s['cover_title'] = ParagraphStyle('cover_title',
        fontName='Helvetica-Bold', fontSize=28, textColor=WHITE,
        leading=34, spaceAfter=10, alignment=TA_LEFT)

    s['cover_sub'] = ParagraphStyle('cover_sub',
        fontName='Helvetica', fontSize=13, textColor=colors.HexColor('#A8C4B8'),
        leading=20, spaceAfter=0, alignment=TA_LEFT)

    s['part_label'] = ParagraphStyle('part_label',
        fontName='Helvetica', fontSize=8, textColor=MID_GRAY,
        spaceBefore=20, spaceAfter=4, letterSpacing=1.8,
        alignment=TA_LEFT)

    s['section_title'] = ParagraphStyle('section_title',
        fontName='Helvetica-Bold', fontSize=16, textColor=CHARCOAL,
        leading=22, spaceBefore=4, spaceAfter=8)

    s['h2'] = ParagraphStyle('h2',
        fontName='Helvetica-Bold', fontSize=12, textColor=CHARCOAL,
        spaceBefore=14, spaceAfter=4, leading=16)

    s['body'] = ParagraphStyle('body',
        fontName='Helvetica', fontSize=10, textColor=DARK_GRAY,
        leading=16, spaceAfter=6)

    s['body_bold'] = ParagraphStyle('body_bold',
        fontName='Helvetica-Bold', fontSize=10, textColor=CHARCOAL,
        leading=16, spaceAfter=4)

    s['small'] = ParagraphStyle('small',
        fontName='Helvetica', fontSize=8.5, textColor=MID_GRAY,
        leading=13, spaceAfter=3)

    s['script'] = ParagraphStyle('script',
        fontName='Helvetica-Oblique', fontSize=10, textColor=CHARCOAL,
        leading=17, spaceAfter=4, leftIndent=0)

    s['label_green'] = ParagraphStyle('label_green',
        fontName='Helvetica-Bold', fontSize=8, textColor=GREEN_DK,
        spaceAfter=3, letterSpacing=0.8)

    s['label_red'] = ParagraphStyle('label_red',
        fontName='Helvetica-Bold', fontSize=8, textColor=RED_DK,
        spaceAfter=3, letterSpacing=0.8)

    s['rule_num'] = ParagraphStyle('rule_num',
        fontName='Helvetica-Bold', fontSize=18, textColor=RULE_CLR,
        leading=20)

    s['rule_text'] = ParagraphStyle('rule_text',
        fontName='Helvetica', fontSize=10, textColor=DARK_GRAY,
        leading=16)

    s['stat_num'] = ParagraphStyle('stat_num',
        fontName='Helvetica-Bold', fontSize=24, textColor=CHARCOAL,
        leading=28, spaceAfter=2)

    s['stat_label'] = ParagraphStyle('stat_label',
        fontName='Helvetica', fontSize=8.5, textColor=MID_GRAY,
        leading=13)

    s['footer'] = ParagraphStyle('footer',
        fontName='Helvetica', fontSize=8, textColor=MID_GRAY,
        alignment=TA_CENTER)

    s['toc_item'] = ParagraphStyle('toc_item',
        fontName='Helvetica', fontSize=10, textColor=DARK_GRAY,
        leading=18, leftIndent=12)

    s['insight_body'] = ParagraphStyle('insight_body',
        fontName='Helvetica', fontSize=10, textColor=DARK_GRAY,
        leading=16, spaceAfter=4)

    s['page_title'] = ParagraphStyle('page_title',
        fontName='Helvetica-Bold', fontSize=20, textColor=CHARCOAL,
        leading=26, spaceBefore=0, spaceAfter=10)

    return s


# ── HELPER FLOWABLES ─────────────────────────────────────────────────────────
class HLine(Flowable):
    def __init__(self, width=None, color=RULE_CLR, thickness=0.5, spaceAfter=8, spaceBefore=0):
        super().__init__()
        self._w = width
        self.color = color
        self.thickness = thickness
        self._spaceAfter = spaceAfter
        self._spaceBefore = spaceBefore

    def wrap(self, availWidth, availHeight):
        self.width = self._w or availWidth
        return self.width, self.thickness + self._spaceAfter + self._spaceBefore

    def draw(self):
        self.canv.setStrokeColor(self.color)
        self.canv.setLineWidth(self.thickness)
        self.canv.line(0, 0, self.width, 0)


def rule(color=RULE_CLR, spaceAfter=12, spaceBefore=4):
    return HRFlowable(width='100%', thickness=0.5, color=color,
                      spaceAfter=spaceAfter, spaceBefore=spaceBefore)


def spacer(h=6):
    return Spacer(1, h)


def card_table(inner_content, bg=LIGHT_BG, border_color=RULE_CLR, padding=12):
    """Wraps content rows in a styled card."""
    t = Table([[inner_content]], colWidths=[155*mm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), bg),
        ('ROUNDEDCORNERS', [6, 6, 6, 6]),
        ('BOX', (0,0), (-1,-1), 0.5, border_color),
        ('TOPPADDING', (0,0), (-1,-1), padding),
        ('BOTTOMPADDING', (0,0), (-1,-1), padding),
        ('LEFTPADDING', (0,0), (-1,-1), padding),
        ('RIGHTPADDING', (0,0), (-1,-1), padding),
    ]))
    return t


def script_block(text, s, accent=GREEN):
    """A styled indented script block."""
    lines = [Paragraph(line, s['script']) for line in text.strip().split('\n') if line.strip()]
    inner = [l for l in lines]
    t = Table([[inner]], colWidths=[155*mm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), LIGHT_BG),
        ('BOX', (0,0), (-1,-1), 0.5, RULE_CLR),
        ('LINEBEFOREA', (0,0), (0,-1), 3, accent),
        ('LINEBEFORE', (0,0), (0,-1), 3, accent),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
    ]))
    return t


def before_after(bad_label, bad_text, good_label, good_text, s):
    bad_cell = [
        Paragraph(bad_label, s['label_red']),
        Paragraph(bad_text, s['script'])
    ]
    good_cell = [
        Paragraph(good_label, s['label_green']),
        Paragraph(good_text, s['script'])
    ]
    t = Table([[bad_cell, good_cell]], colWidths=[74*mm, 74*mm],
              hAlign='LEFT')
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), RED_LT),
        ('BACKGROUND', (1,0), (1,-1), GREEN_LT),
        ('BOX', (0,0), (0,-1), 0.5, colors.HexColor('#F09595')),
        ('BOX', (1,0), (1,-1), 0.5, colors.HexColor('#97C459')),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    return t


def stat_grid(stats, s):
    """stats = list of (number, label) tuples, 2-per-row"""
    cells = []
    row = []
    for i, (num, lbl) in enumerate(stats):
        cell = [Paragraph(num, s['stat_num']), Paragraph(lbl, s['stat_label'])]
        row.append(cell)
        if len(row) == 2:
            cells.append(row)
            row = []
    if row:
        row.append([''])
        cells.append(row)
    t = Table(cells, colWidths=[74*mm, 74*mm], hAlign='LEFT')
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), LIGHT_BG),
        ('BOX', (0,0), (0,0), 0.5, RULE_CLR),
        ('BOX', (1,0), (1,0), 0.5, RULE_CLR),
        ('BOX', (0,1), (0,1), 0.5, RULE_CLR),
        ('BOX', (1,1), (1,1), 0.5, RULE_CLR),
        ('TOPPADDING', (0,0), (-1,-1), 12),
        ('BOTTOMPADDING', (0,0), (-1,-1), 12),
        ('LEFTPADDING', (0,0), (-1,-1), 14),
        ('RIGHTPADDING', (0,0), (-1,-1), 14),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    return t


def numbered_insight(num, bold_text, body_text, s):
    num_cell = [Paragraph(num, s['rule_num'])]
    body_cell = [
        Paragraph(f'<b>{bold_text}</b>', s['body_bold']),
        Paragraph(body_text, s['body'])
    ]
    t = Table([[num_cell, body_cell]], colWidths=[16*mm, 139*mm])
    t.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    return t


def dot_insight(bold_text, body_text, s):
    dot_cell = [Paragraph('•', ParagraphStyle('dot', fontName='Helvetica-Bold',
                fontSize=14, textColor=GREEN, leading=16))]
    body_cell = [Paragraph(f'<b>{bold_text}</b> {body_text}', s['body'])]
    t = Table([[dot_cell, body_cell]], colWidths=[8*mm, 147*mm])
    t.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    return t


# ── PAGE TEMPLATE ─────────────────────────────────────────────────────────────
def add_page_decorations(canvas, doc):
    canvas.saveState()
    w, h = A4
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(MID_GRAY)
    canvas.setStrokeColor(RULE_CLR)
    canvas.setLineWidth(0.5)
    canvas.line(20*mm, 14*mm, w - 20*mm, 14*mm)

    pg = doc.page
    if pg > 1:
        canvas.drawString(20*mm, 10*mm, 'CatalogHQ — Research-Backed Vendor Marketing Kit')
        canvas.drawRightString(w - 20*mm, 10*mm, str(pg))

    canvas.restoreState()


# ── COVER PAGE ───────────────────────────────────────────────────────────────
def cover_page(s):
    story = []

    # Dark green banner drawn via a Table trick
    cover_data = [[
        [
            Paragraph('VENDOR MARKETING KIT  ·  RESEARCH EDITION', s['cover_tag']),
            spacer(10),
            Paragraph('CatalogHQ', s['cover_title']),
            Paragraph('Your storefront for social selling', s['cover_sub']),
            spacer(20),
            HRFlowable(width=40*mm, thickness=1.5, color=GREEN, spaceAfter=20),
            Paragraph(
                'Rebuilt from the ground up using proven copywriting research,\n'
                'Nigerian social commerce data, and conversion psychology.',
                s['cover_sub']),
            spacer(16),
            Paragraph(
                'Includes:  WhatsApp Sequences  ·  Social Posts  ·  Meta Ad Copy  ·  In-Person Scripts  ·  Objection Handling',
                ParagraphStyle('cover_inc', fontName='Helvetica', fontSize=9,
                               textColor=colors.HexColor('#7AAFA0'), leading=14)),
        ]
    ]]

    t = Table(cover_data, colWidths=[170*mm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), COVER_BG),
        ('TOPPADDING', (0,0), (-1,-1), 48),
        ('BOTTOMPADDING', (0,0), (-1,-1), 48),
        ('LEFTPADDING', (0,0), (-1,-1), 22),
        ('RIGHTPADDING', (0,0), (-1,-1), 22),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t)
    story.append(spacer(22))

    # Quick stat strip
    strip_data = [
        [
            [Paragraph('32.7%', s['stat_num']),
             Paragraph('reply rate lift from specific\npersonalization vs generic pitch', s['stat_label'])],
            [Paragraph('98%', s['stat_num']),
             Paragraph('WhatsApp open rate — but most\nmessages still get ignored', s['stat_label'])],
            [Paragraph('4x', s['stat_num']),
             Paragraph('more replies when you reference\nsomething specific about the vendor', s['stat_label'])],
        ]
    ]
    strip = Table(strip_data, colWidths=[52*mm, 52*mm, 52*mm])
    strip.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), LIGHT_BG),
        ('BOX', (0,0), (-1,-1), 0.5, RULE_CLR),
        ('TOPPADDING', (0,0), (-1,-1), 12),
        ('BOTTOMPADDING', (0,0), (-1,-1), 12),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LINEAFTER', (0,0), (1,-1), 0.5, RULE_CLR),
    ]))
    story.append(strip)
    story.append(PageBreak())
    return story


# ── SECTION HEADER HELPER ────────────────────────────────────────────────────
def sec_header(part_label_text, title_text, s):
    return [
        Paragraph(part_label_text.upper(), s['part_label']),
        Paragraph(title_text, s['section_title']),
        rule(spaceAfter=14),
    ]


# ── BUILD DOCUMENT ────────────────────────────────────────────────────────────
def build():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.normpath(os.path.join(script_dir, '..', '..'))
    output_path = os.path.join(repo_root, 'docs', 'CatalogHQ_Vendor_Marketing_Kit.pdf')
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=20*mm, rightMargin=20*mm,
        topMargin=20*mm, bottomMargin=22*mm,
        title='CatalogHQ — Research-Backed Vendor Marketing Kit',
        author='CatalogHQ',
    )
    s = make_styles()
    story = []

    # ── COVER ────────────────────────────────────────────────────────────────
    story += cover_page(s)

    # ── WHY THE OLD KIT FAILED ───────────────────────────────────────────────
    story += sec_header('Research Foundation', 'Why vendors were ignoring you — and what the research says', s)

    story.append(Paragraph(
        'Before rewriting any copy, we need to understand the precise reasons the original kit was ignored. '
        'These are not opinions — each failure maps directly to a documented conversion principle.',
        s['body']))
    story.append(spacer(10))

    failures = [
        ('1', 'It opened with your product, not their problem.',
         'Every message led with CatalogHQ in the first two sentences. '
         'Research shows the fastest way to get ignored is sending a message that could have gone to anyone. '
         'Vendors scanned it, recognised a pitch, and closed it in under 3 seconds.'),
        ('2', 'The pain described was generic, not observed.',
         '"Scattered DMs and lost orders" could apply to any seller anywhere. '
         'Nigerian vendors specifically face a deep buyer-trust crisis — 24% of Nigerian social-commerce buyers '
         'have been scammed, which forces vendors to spend enormous time reassuring customers before every transaction. '
         'That is the real daily pain. The original copy never touched it.'),
        ('3', 'Every CTA asked for too much from a cold contact.',
         '"Set up your store today" requires someone to open a website, create an account, '
         'and list their products. Research on cold outreach proves that small, low-friction asks '
         '(a reply, a single question answered) convert far better than transactional CTAs with cold audiences. '
         'The goal of message 1 is to get message 2 opened — nothing more.'),
        ('4', 'The messages read like broadcasts, not conversations.',
         'WhatsApp has a 98% open rate, but only when messages feel personal. '
         '"Hi [First Name]" + product pitch is now instantly recognisable as spam. '
         'It triggers the same ignore-response as a promotional email, regardless of channel.'),
        ('5', 'The social proof was vague and therefore valueless.',
         '"Thousands of sellers use CatalogHQ" with no names, no locations, and no specific results '
         'registers as zero proof. In a market where trust is already fragile, '
         'unverifiable claims actively reduce credibility rather than build it.'),
    ]

    for num, bold, body in failures:
        story.append(numbered_insight(num, bold, body, s))
        story.append(rule(spaceAfter=8))

    story.append(spacer(12))

    story.append(Paragraph('What the data tells us', s['h2']))
    story.append(stat_grid([
        ('32.7%', 'better reply rate for personalised messages\nvs generic outreach (Backlinko)'),
        ('4x', 'more replies when you reference something\nspecific about the vendor\'s own business'),
        ('98%', 'WhatsApp open rate — but most messages\nstill ignored because they feel promotional'),
        ('1 idea', 'per message. Multiple ideas create confusion\nand decision paralysis. One point only.'),
    ], s))

    story.append(PageBreak())

    # ── NIGERIAN VENDOR PSYCHOLOGY ───────────────────────────────────────────
    story += sec_header('Nigerian Context', 'The vendor psychology you must understand before saying a word', s)

    story.append(Paragraph(
        'Generic conversion advice is not enough here. Nigerian social commerce has specific dynamics '
        'that must shape every message you send.',
        s['body']))
    story.append(spacer(10))

    insights = [
        ('Trust is the #1 blocker — not disorganisation.',
         'Around 24% of Nigerian buyers have been scammed on social media. Vendors know this. '
         'They spend massive amounts of time manually reassuring customers before every transaction closes. '
         'This is their real daily pain. CatalogHQ solves it — a proper storefront signals credibility '
         'before the first message is even sent — but your copy never made that case.'),
        ('WhatsApp wins because it feels personal, not because it is functional.',
         'Over 85% of Nigerian active social media users are on WhatsApp, and vendors report '
         'higher trust from buyers there than on Instagram. The reason is emotional: it feels like a conversation '
         'between people, not a transaction. Any outreach message that feels like a company talking '
         'to a target will be ignored. Any message that feels like one person talking to another will be read.'),
        ('Vendors want to enhance what they do, not replace it.',
         'Nigerian WhatsApp sellers have built income around direct conversation — voice notes for negotiation, '
         'personal check-ins, behind-the-scenes content. Telling them there is a "better way" sounds like a threat '
         'to their livelihood. Position CatalogHQ as sitting alongside their existing channels, '
         'removing the exhausting parts (the repetitive "how much?" messages) while keeping the personal relationship intact.'),
        ('Pricing negotiation is cultural — work with it.',
         'Traditional e-commerce platforms fail in Nigeria because they cannot accommodate negotiation, '
         'a fundamental part of Nigerian buying culture. Your pitch should never frame CatalogHQ as '
         'removing the vendor-customer relationship. Frame it as giving customers all the information '
         'they need so that when they do message, they are ready to buy — not just browsing.'),
    ]

    for bold, body in insights:
        story.append(dot_insight(bold, body, s))
        story.append(rule(spaceAfter=8))

    story.append(PageBreak())

    # ── WHATSAPP SEQUENCE ────────────────────────────────────────────────────
    story += sec_header('Section 01 — WhatsApp Outreach', 'The 3-message sequence that starts real conversations', s)

    story.append(Paragraph(
        'The original single-broadcast approach fails because it tries to close in one message. '
        'Research shows the first message should have exactly one goal: earn a reply. '
        'Everything else follows from there.',
        s['body']))
    story.append(spacer(10))

    # M1
    story.append(Paragraph('Message 1 — Day 1  (observation + one question, zero pitch)', s['h2']))
    story.append(Paragraph(
        'The entire job of this message is to get a reply. Reference something specific you saw on their page. '
        'Ask one question about their workflow. Do not mention CatalogHQ at all.',
        s['small']))
    story.append(spacer(6))
    story.append(script_block(
        "Hey [Name], came across your [product type — jeans/skincare/food items] on [platform].\n"
        "Love the [specific detail — e.g. the packaging/product variety/photo quality].\n\n"
        "Quick question — when a new customer asks what else you sell, what do you normally send them?",
        s))
    story.append(spacer(6))
    story.append(Paragraph(
        'Why this works: You prove you looked at their page. You ask about their workflow, not your product. '
        'You make zero ask. People answer questions about themselves — they cannot help it.',
        s['small']))
    story.append(spacer(12))

    # M2
    story.append(Paragraph('Message 2 — After they reply  (acknowledge + one-sentence intro)', s['h2']))
    story.append(Paragraph(
        'Acknowledge their specific answer before introducing anything. '
        'One sentence about the product. One soft ask at the end.',
        s['small']))
    story.append(spacer(6))
    story.append(script_block(
        "Yeah, that's exactly what most sellers I talk to deal with — customers ask, you send something, "
        "then they go quiet.\n\n"
        "I actually built something that fixes that specific thing. It gives you one link your customers "
        "can open and see everything at once — prices, photos, all of it — without having to message you first.\n\n"
        "Want me to show you what it looks like?",
        s))
    story.append(spacer(12))

    # M3
    story.append(Paragraph('Message 3 — After they say yes  (show, don\'t tell)', s['h2']))
    story.append(Paragraph(
        'Send the demo link immediately. Describe what they will see before they tap it. '
        'End with the softest possible next step.',
        s['small']))
    story.append(spacer(6))
    story.append(script_block(
        "Here's a demo store → [your demo link]\n\n"
        "That's exactly what your page would look like. Your customers tap the link, see everything, "
        "and send you an order message. No 'what do you sell?' No 'how much?' — they already have all the info.\n\n"
        "Takes about 5 minutes to set up. Want to try it?",
        s))
    story.append(spacer(14))

    story.append(Paragraph('Re-engagement message  (for contacts who didn\'t reply)', s['h2']))
    story.append(script_block(
        "Hey [Name], just following up on my earlier message.\n\n"
        "Thought of something that might make it more relevant for you specifically — "
        "a lot of [clothing/food/beauty] sellers I've spoken to say their biggest problem "
        "isn't getting customers to message them, it's getting them to actually buy "
        "after that first message. That's the gap this closes.\n\n"
        "Happy to show you in 2 minutes if you want. No commitment.",
        s))
    story.append(spacer(6))
    story.append(Paragraph(
        'Key change from original: References their specific product category. '
        'Names the real problem (post-message drop-off) rather than a generic pain. '
        'Ends with a time commitment (2 minutes) instead of a vague ask.',
        s['small']))

    story.append(PageBreak())

    # ── SOCIAL MEDIA POSTS ───────────────────────────────────────────────────
    story += sec_header('Section 02 — Social Media Posts', 'Captions that lead with problems, not products', s)

    story.append(Paragraph(
        'The research principle here: name the feeling before you name the solution. '
        'These posts are built on the specific trust and friction problems Nigerian vendors\' customers face — '
        'not on feature lists.',
        s['body']))
    story.append(spacer(10))

    # Before/after
    story.append(Paragraph('Before and after — the structural shift', s['h2']))
    story.append(before_after(
        'OLD APPROACH — feature-led',
        'With CatalogHQ, you get: a professional digital storefront, a unique shareable link, '
        'customers can browse & order — no account needed...',
        'NEW APPROACH — problem-led',
        'Your customers are not buying because they cannot be bothered to DM you. They see your product. '
        'They want it. Then they have to send a DM, wait for a reply, ask for prices...',
        s))
    story.append(spacer(14))

    posts = [
        ('Post 1 — Instagram / Facebook  (highest engagement format: customer journey)',
         "Your customers are not buying because they can't be bothered to DM you.\n\n"
         "Think about it. They see your product. They want it. Then they have to:\n"
         "— Send a DM\n"
         "— Wait for your reply\n"
         "— Ask about price\n"
         "— Ask about sizes or variants\n"
         "— Send payment\n\n"
         "Half of them leave before step 2.\n\n"
         "CatalogHQ gives them one link where they can see everything and order directly. "
         "No back-and-forth needed before they're ready to pay.\n\n"
         "[your link here]\n\n"
         "#CatalogHQ #NigerianSeller #OnlineBusiness #SmallBizNigeria #WhatsAppBusiness"),
        ('Post 2 — Trust angle  (speaks to the trust problem directly)',
         "Nigerian customers are careful. They've been scammed before.\n\n"
         "So when they land on a seller with a proper storefront — products clearly listed, prices visible, "
         "photos real — they trust you faster. They stop hesitating. They buy.\n\n"
         "CatalogHQ doesn't replace your WhatsApp or Instagram. "
         "It gives new customers a reason to trust you before they even send a message.\n\n"
         "Set up your free store → [your link here]\n\n"
         "#CatalogHQ #SocialSelling #TrustMatters #InstagramSeller #SmallBusiness"),
        ('Post 3 — Ultra short  (for Stories, X/Twitter, Threads)',
         "If a customer sees your product and can't find the price in 5 seconds, they leave.\n\n"
         "CatalogHQ fixes that. → [your link]"),
        ('Post 4 — Story/transformation format  (before & after)',
         "Before: 'What do you sell?' 'How much?' 'Do you deliver?' — every single day.\n\n"
         "After: Customers tap your link, see everything, and send one message: 'I want to order.'\n\n"
         "That's what one link does when it's set up properly.\n\n"
         "→ [your link here]\n\n"
         "#WorkSmart #CatalogHQ #DigitalStorefront #Entrepreneur #OnlineSeller"),
    ]

    for title, text in posts:
        story.append(KeepTogether([
            Paragraph(title, s['h2']),
            spacer(4),
            script_block(text, s),
            spacer(12),
        ]))

    story.append(PageBreak())

    # ── META ADS ─────────────────────────────────────────────────────────────
    story += sec_header('Section 03 — Meta / Instagram Ad Copy', 'Structured for Meta Ads Manager', s)

    story.append(Paragraph(
        'Each ad follows the research-backed structure: specific context → '
        'evidence of the reader\'s problem → cost of inaction → social proof → low-friction CTA.',
        s['body']))
    story.append(spacer(10))

    ads = [
        ('Ad 1 — Awareness  (top of funnel)',
         "PRIMARY TEXT\n"
         "Nigerian customers don't trust sellers they can't verify.\n\n"
         "That's why they ask the same questions every time — 'how much?', 'is it real?', 'do you deliver?' "
         "— before they'll even consider buying. It's not laziness. It's caution.\n\n"
         "CatalogHQ gives you a professional storefront that answers those questions before the first message. "
         "Clean product listings. Real photos. Clear prices. One link, shareable anywhere.\n\n"
         "When customers can see everything up front, they trust you faster — and they buy.\n\n"
         "HEADLINE\nStop answering the same questions. Start closing more orders.\n\n"
         "DESCRIPTION\nProfessional storefront. Shareable link. Customers shop without DMing first.\n\n"
         "CTA BUTTON\nSee How It Works"),
        ('Ad 2 — Conversion  (bottom of funnel)',
         "PRIMARY TEXT\n"
         "You're losing customers between 'I'm interested' and 'I'll buy.'\n\n"
         "They message you. You reply. They ask more questions. You answer. Then — silence. "
         "They moved on, found someone with a cleaner page, or just gave up.\n\n"
         "CatalogHQ closes that gap:\n"
         "→ All your products, prices, and photos in one place\n"
         "→ One link to post on Instagram bio, WhatsApp status, anywhere\n"
         "→ Customers browse and place orders — no account needed\n"
         "→ Set up in 5 minutes. Free to start.\n\n"
         "HEADLINE\nGet your free digital storefront today.\n\n"
         "DESCRIPTION\nBuilt for Instagram, WhatsApp and Facebook sellers in Nigeria.\n\n"
         "CTA BUTTON\nGet Started Free"),
        ('Ad 3 — Retargeting  (visited but didn\'t sign up)',
         "PRIMARY TEXT\n"
         "You checked out CatalogHQ but didn't set up your store yet.\n\n"
         "Here's what's happening right now while you wait: a customer is looking at your Instagram, "
         "wondering how much something costs, and deciding whether to message you or move on. "
         "Most of them move on.\n\n"
         "It takes 5 minutes to fix that. Your store is waiting.\n\n"
         "HEADLINE\nYour store is still waiting.\n\n"
         "DESCRIPTION\n5 minutes to set up. Your customers are ready — are you?\n\n"
         "CTA BUTTON\nComplete My Store"),
    ]

    for title, text in ads:
        story.append(KeepTogether([
            Paragraph(title, s['h2']),
            spacer(4),
            script_block(text, s),
            spacer(12),
        ]))

    story.append(PageBreak())

    # ── IN-PERSON SCRIPT ─────────────────────────────────────────────────────
    story += sec_header('Section 04 — In-Person Script', 'The vendor pitch that feels like a conversation', s)

    story.append(Paragraph(
        'The fatal flaw in the original script: it opened with "I run a platform that helps vendors get a proper storefront." '
        'That immediately marks you as a salesperson and them as a target. '
        'The rewrite opens with a question that makes them say the problem out loud — '
        'so you never have to convince them it exists.',
        s['body']))
    story.append(spacer(10))

    story.append(Paragraph('The opening — leads with curiosity, not a pitch', s['h2']))
    story.append(script_block(
        '"Quick question — if I wanted to see everything you sell right now, what would you show me?"\n\n'
        '[Let them answer.]\n\n'
        '"And if a customer asked you that same question at 11pm — what happens?"',
        s))
    story.append(spacer(6))
    story.append(Paragraph(
        'They will either laugh or describe the problem themselves. '
        'You have not made a single claim. They have said the problem out loud. '
        'Now your product is the answer to a question they just raised — not a pitch you forced on them.',
        s['small']))
    story.append(spacer(12))

    story.append(Paragraph('After they describe the problem', s['h2']))
    story.append(script_block(
        '"That\'s exactly what I built something for. It gives your customers one link — "  '
        '"they tap it, see everything you sell with photos and prices, and send you a proper order. "  '
        '"No back and forth before they\'re ready to pay."\n\n'
        '"Want to see what it looks like? I can pull it up right now."',
        s))
    story.append(spacer(12))

    story.append(Paragraph('After they say yes — show the demo', s['h2']))
    story.append(script_block(
        '[Show your phone with the demo store]\n\n'
        '"This is how your page would look. Your customers see everything at once — "  '
        '"clean, like a real store. They tap what they want and send you the order. "  '
        '"No more \'how much?\' every five minutes."\n\n'
        '"Takes about 5 minutes to set up. Starts free. You want to try it?"',
        s))
    story.append(spacer(12))

    story.append(Paragraph('30-second version  (for quick encounters)', s['h2']))
    story.append(script_block(
        '"Quick question — when customers ask what you sell, what do you normally do?"\n\n'
        '[They answer.]\n\n'
        '"There\'s a tool called CatalogHQ — one link, all your products, "  '
        '"customers order directly without the back-and-forth. Free to start. "  '
        '"[your link] — check it out."',
        s))

    story.append(spacer(6))

    alts = [
        ('At a market or event:',
         '"Hi, I noticed you\'re selling here — I build tools for vendors to get a shareable online store. '
         'It takes 5 minutes to set up and customers can browse everything you sell without DMing you first. '
         'Can I show you quickly?"'),
        ('If someone referred you:',
         '"Hi [Name], [Referrer] said I should reach out — I help sellers set up a proper storefront '
         'so customers can see everything before they even message. Thought it might be useful for you."'),
        ('WhatsApp cold opener  (before sending the sequence):',
         '"Hi [Name], I build tools for online sellers and came across your page — '
         'would it be okay if I shared something that might help?"'),
    ]
    for label, text in alts:
        story.append(Paragraph(label, s['body_bold']))
        story.append(script_block(text, s))
        story.append(spacer(8))

    story.append(PageBreak())

    # ── OBJECTION HANDLING ───────────────────────────────────────────────────
    story += sec_header('Section 05 — Objection Handling', 'Responses built on the real reasons behind each objection', s)

    story.append(Paragraph(
        'Every objection has a real reason behind it. '
        'These responses address that real reason first, then answer the surface question.',
        s['body']))
    story.append(spacer(10))

    objections = [
        ('"I already use Instagram / WhatsApp catalog"',
         'The real concern: I\'ve already invested time in what I have.',
         'CatalogHQ doesn\'t replace either of those — it works alongside them. '
         'Think of it as a dedicated link you add to your Instagram bio or pin on WhatsApp. '
         'The difference is that when a new customer clicks it, they see a proper storefront — '
         'not a list of saved catalogue items. It makes the investment you\'ve already made look more professional.'),
        ('"I don\'t have time to set it up"',
         'The real concern: every new tool feels like more work.',
         'It genuinely takes 5 minutes — you add your products, photos, and prices, and you\'re done. '
         'That\'s one-time work that saves you from answering "what do you sell?" and "how much?" '
         'every day for the rest of the time you\'re in business. I can walk you through the first product '
         'right now if you want.'),
        ('"Is it safe? Will my customers\' details be shared?"',
         'The real concern: I\'ve heard bad stories about online platforms.',
         'Your customers don\'t share any payment information with CatalogHQ. '
         'They just browse and send you an order message. You handle payment however you normally do — '
         'bank transfer, cash, whatever works for your customers. Nothing changes on that side.'),
        ('"How much does it cost?"',
         'The real concern: I\'ve signed up for things that cost more than they\'re worth.',
         'It\'s free to start — you can set up your store and take orders without paying anything. '
         'When you\'re ready to unlock more, it\'s ₦3,000 a month — less than ₦100 a day. '
         'If closing one extra order this month because a customer could browse properly and trust you enough to buy '
         'pays for the whole month, then it\'s already worth it. But start free and see for yourself.'),
        ('"I\'m not tech-savvy"',
         'The real concern: I\'ve been embarrassed by technology before.',
         'If you can post on Instagram, you can use CatalogHQ. '
         'You add a product the same way you\'d post a photo — name, price, picture. '
         'That\'s it. I can show you the whole process in about 90 seconds right now.'),
    ]

    for obj, real_concern, response in objections:
        story.append(KeepTogether([
            Paragraph(obj, s['h2']),
            Paragraph(f'Real concern behind it: {real_concern}', s['small']),
            spacer(4),
            script_block(response, s),
            spacer(12),
        ]))

    story.append(PageBreak())

    # ── QUICK REFERENCE ──────────────────────────────────────────────────────
    story += sec_header('Quick Reference', 'The 6 rules that apply to everything you send', s)

    story.append(Paragraph(
        'Print this page. Before sending any message, check it against every rule.',
        s['body']))
    story.append(spacer(10))

    rules = [
        ('1', 'One message, one idea.',
         'Never introduce CatalogHQ and list features and include a CTA in the same message. '
         'Pick one point. Everything else goes in the next message.'),
        ('2', 'Reference something specific.',
         'Their product name. Their Instagram bio. Something you actually saw. '
         'This produces the single biggest lift in reply rates of any technique — '
         'up to 4x more replies vs generic outreach.'),
        ('3', 'Ask before you pitch.',
         'A question is a low-friction opener. A pitch is a high-friction opener. '
         'Always lead with a question about their situation, especially in cold outreach.'),
        ('4', 'Name the problem they recognise, not the feature that solves it.',
         '"Customers who message you and never reply again" is a feeling they know. '
         '"Shareable link for your full catalog" is a feature they have to imagine. '
         'Lead with the feeling.'),
        ('5', 'Social proof must be specific to be credible.',
         '"A seller in Yaba set up her store in 5 minutes and said customers stopped asking for her price list" '
         'converts. "Thousands of sellers use CatalogHQ" does not. '
         'Names, locations, and specific results build trust. Vague numbers do not.'),
        ('6', 'Make the next step tiny.',
         '"Want me to show you?" is a better CTA than "sign up free." '
         'The goal of message 1 is to get message 2 opened. '
         'The goal of message 2 is to get a yes to a demo. '
         'Sell the next step, not the product.'),
    ]

    for num, bold, body in rules:
        story.append(numbered_insight(num, bold, body, s))
        story.append(rule(spaceAfter=8))

    story.append(spacer(20))
    story.append(rule(color=ACCENT, spaceAfter=12))
    story.append(Paragraph(
        'CatalogHQ — Your storefront for social selling',
        ParagraphStyle('footer_brand', fontName='Helvetica-Bold', fontSize=9,
                       textColor=DARK_GRAY, alignment=TA_CENTER)))
    story.append(Paragraph(
        'This kit was rebuilt using research on Nigerian social commerce behaviour, '
        'cold outreach conversion psychology, and proven B2B SaaS copywriting principles.',
        s['footer']))

    # ── BUILD ─────────────────────────────────────────────────────────────────
    doc.build(story, onFirstPage=add_page_decorations, onLaterPages=add_page_decorations)
    print(f"PDF created: {output_path}")


if __name__ == '__main__':
    build()
