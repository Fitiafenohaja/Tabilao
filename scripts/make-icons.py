"""Génère les icônes Tabilao : un « T » de trois cellules (blanc · rouge · blanc, pied vert)."""
# Usage : python3 scripts/make-icons.py assets   (nécessite Pillow)
import sys
from PIL import Image, ImageDraw

OUT = sys.argv[1]
WHITE, RED, GREEN = (255, 255, 255, 255), (252, 61, 50, 255), (0, 126, 58, 255)
LINE, TINT = (203, 213, 207, 255), (238, 248, 242, 255)
SS = 4  # suréchantillonnage pour des bords lisses


def logo(draw, cx, cy, size, mono=None):
    """Grille 3 × 3 : ligne du haut blanc / rouge / blanc, pied vert sur deux cellules au centre."""
    cell, gap = size / 3, size * 0.035
    r = cell * 0.18
    x0, y0 = cx - size / 2, cy - size / 2

    def box(col, row, rows=1):
        return [x0 + col * cell + gap / 2, y0 + row * cell + gap / 2,
                x0 + (col + 1) * cell - gap / 2, y0 + (row + rows) * cell - gap / 2]

    def cell_fill(rect, fill, outline=False):
        if mono:
            draw.rounded_rectangle(rect, r, fill=mono)
        elif outline:
            draw.rounded_rectangle(rect, r, fill=fill, outline=LINE, width=max(2, int(size * 0.012)))
        else:
            draw.rounded_rectangle(rect, r, fill=fill)

    cell_fill(box(0, 0), WHITE, outline=True)
    cell_fill(box(1, 0), RED)
    cell_fill(box(2, 0), WHITE, outline=True)
    cell_fill(box(1, 1, rows=2), GREEN)


def render(name, background, logo_ratio, mono=None, size=1024):
    big = size * SS
    img = Image.new('RGBA', (big, big), background)
    logo(ImageDraw.Draw(img), big / 2, big / 2, big * logo_ratio, mono)
    img.resize((size, size), Image.LANCZOS).save(f'{OUT}/{name}', optimize=True)


# Icône classique (Expo Go, anciens Android, Play Store) : fond teinté, logo au centre.
render('icon.png', TINT, 0.56)
# Icône adaptative : premier plan transparent, logo dans la zone sûre (66 % centraux).
render('android-icon-foreground.png', (0, 0, 0, 0), 0.46)
render('android-icon-background.png', TINT, 0.0)
# Icône monochrome (thèmes Android 13+) : seule la silhouette compte.
render('android-icon-monochrome.png', (0, 0, 0, 0), 0.46, mono=(0, 0, 0, 255))
# Écran de démarrage : logo seul sur fond transparent (le fond blanc vient de la config).
render('splash-icon.png', (0, 0, 0, 0), 0.9)
