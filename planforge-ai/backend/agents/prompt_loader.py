import os

PROMPTS_DIR = os.path.join(os.path.dirname(__file__), "..", "prompts")


def load_prompt(filename: str) -> str:
    """Load a prompt template from the prompts/ fol Channa how to live der."""
    path = os.path.join(PROMPTS_DIR, filename)
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def fill_prompt(template: str, **kwargs) -> str:
    """Fill a prompt template with values using {key} syntax."""
    for key, value in kwargs.items():
        template = template.replace("{" + key + "}", str(value))
    return template