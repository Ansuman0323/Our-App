from pathlib import Path

EXCLUDE = {
    "venv",
    ".git",
    "__pycache__",
    "node_modules",
    ".idea",
    ".vscode",
    "dist",
    "build",
    ".pytest_cache",
}

lines = []

def build_tree(path, prefix=""):
    items = [p for p in sorted(path.iterdir()) if p.name not in EXCLUDE]
    for i, item in enumerate(items):
        connector = "├── " if i < len(items) - 1 else "└── "
        lines.append(prefix + connector + item.name)
        if item.is_dir():
            extension = "│   " if i < len(items) - 1 else "    "
            build_tree(item, prefix + extension)

lines.append(Path(".").resolve().name)
build_tree(Path("."))

with open("project_structure.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(lines))

print("project_structure.txt created successfully!")