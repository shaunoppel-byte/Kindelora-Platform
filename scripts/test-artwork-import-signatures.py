#!/usr/bin/env python3
"""Regression tests for binary artwork signatures (offline, no network)."""
import ast
from pathlib import Path
import unittest

SOURCE = (Path(__file__).resolve().parent / "import-affirmation-artwork.py").read_text()
TREE = ast.parse(SOURCE)
FUNCTION = next((n for n in ast.walk(TREE) if isinstance(n, ast.If) and isinstance(n.test, ast.Compare) and any(isinstance(c, ast.Constant) and c.value == ".webp" for c in n.test.comparators)), None)

class ArtworkMagicByteTests(unittest.TestCase):
    def test_importer_has_correct_binary_magic(self):
        self.assertIn('bytes.fromhex("ffd8ff")', SOURCE)
        self.assertIn('bytes.fromhex("ffd9")', SOURCE)
        self.assertIn('bytes.fromhex("89504e470d0a1a0a")', SOURCE)
        self.assertEqual(bytes.fromhex("ffd8ff"), b"\xff\xd8\xff")
        self.assertEqual(bytes.fromhex("89504e470d0a1a0a"), b"\x89PNG\r\n\x1a\n")
    def test_no_literal_escaped_magic_bytes(self):
        self.assertNotIn('b"\\\\xff', SOURCE)
        self.assertNotIn('b"\\\\x89PNG', SOURCE)

if __name__ == "__main__":
    unittest.main()
