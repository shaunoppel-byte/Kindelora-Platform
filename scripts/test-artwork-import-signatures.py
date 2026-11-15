#!/usr/bin/env python3
"""Offline executable regression tests for artwork import signature checks."""
import ast
from pathlib import Path
import unittest

SOURCE = (Path(__file__).resolve().parent / "import-affirmation-artwork.py").read_text(encoding="utf-8")
TREE = ast.parse(SOURCE)
# Execute the actual validation expression from the importer, not a duplicate implementation.
SIGNATURE_IF = next(
    n for n in ast.walk(TREE)
    if isinstance(n, ast.If)
    and isinstance(n.test, ast.Compare)
    and isinstance(n.test.left, ast.Name)
    and n.test.left.id == "suffix"
    and any(isinstance(c, ast.Constant) and c.value == ".webp" for c in n.test.comparators)
)
SIGNATURE_BLOCK = ast.Module(body=[SIGNATURE_IF], type_ignores=[])
ast.fix_missing_locations(SIGNATURE_BLOCK)
SIGNATURE_CODE = compile(SIGNATURE_BLOCK, "<importer-signature-validation>", "exec")

def accepts(suffix, data):
    scope = {"suffix": suffix, "data": data}
    exec(SIGNATURE_CODE, {"bytes": bytes}, scope)
    return scope["valid"]

class ArtworkMagicByteTests(unittest.TestCase):
    def test_jpeg_accepts_actual_magic_bytes(self):
        self.assertTrue(accepts(".jpg", bytes.fromhex("ffd8ff") + b"example" + bytes.fromhex("ffd9")))
        self.assertTrue(accepts(".jpeg", bytes.fromhex("ffd8ff") + b"example" + bytes.fromhex("ffd9")))
    def test_jpeg_rejects_wrong_header_and_footer(self):
        self.assertFalse(accepts(".jpg", b"NOTJPEG" + bytes.fromhex("ffd9")))
        self.assertFalse(accepts(".jpeg", bytes.fromhex("ffd8ff") + b"missing-eoi"))
    def test_png_accepts_and_rejects_actual_magic_bytes(self):
        self.assertTrue(accepts(".png", bytes.fromhex("89504e470d0a1a0a") + b"example"))
        self.assertFalse(accepts(".png", b"NOTPNG" + b"example"))
    def test_webp_accepts_and_rejects_actual_magic_bytes(self):
        self.assertTrue(accepts(".webp", b"RIFF" + b"1234" + b"WEBP" + b"example"))
        self.assertFalse(accepts(".webp", b"RIFF" + b"1234" + b"NOTW" + b"example"))
    def test_unknown_extension_is_rejected(self):
        self.assertFalse(accepts(".gif", b"GIF89a" + b"example"))

if __name__ == "__main__":
    unittest.main()
