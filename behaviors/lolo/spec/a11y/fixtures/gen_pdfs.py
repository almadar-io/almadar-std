import os

HERE = os.path.dirname(os.path.abspath(__file__))


def build(content):
    objs = [
        "<< /Type /Catalog /Pages 2 0 R >>",
        "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
        f"<< /Length {len(content)} >>\nstream\n{content}\nendstream",
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    ]
    out = b"%PDF-1.4\n"
    offs = []
    for i, o in enumerate(objs, 1):
        offs.append(len(out))
        out += f"{i} 0 obj\n{o}\nendobj\n".encode("latin-1")
    x = len(out)
    out += f"xref\n0 {len(objs) + 1}\n0000000000 65535 f \n".encode()
    for o in offs:
        out += f"{o:010d} 00000 n \n".encode()
    out += f"trailer\n<< /Size {len(objs) + 1} /Root 1 0 R >>\nstartxref\n{x}\n%%EOF\n".encode()
    return out


def text_pdf():
    lines = ["Cenik - Loncarna Mala", "Keramicni lonec ........ 24,90 EUR", "Skodelica za caj ...... 9,50 EUR", "Kroznik globoki ....... 12,00 EUR", "Cene vsebujejo DDV."]
    c = "BT /F1 16 Tf 72 760 Td 22 TL\n" + "".join(f"({l}) Tj T*\n" for l in lines) + "ET"
    return build(c)


def rect_pdf():
    c = "0.2 0.3 0.6 rg 72 700 300 20 re f\n0.2 0.3 0.6 rg 72 660 220 20 re f\n0.2 0.3 0.6 rg 72 620 260 20 re f"
    return build(c)


def main():
    for d in (os.path.join(HERE, "docs"), os.path.join(HERE, "shop", "docs")):
        os.makedirs(d, exist_ok=True)
    for d in (os.path.join(HERE, "docs"), os.path.join(HERE, "shop", "docs")):
        open(os.path.join(d, "cenik.pdf"), "wb").write(text_pdf())
    open(os.path.join(HERE, "docs", "scan.pdf"), "wb").write(rect_pdf())


main()
