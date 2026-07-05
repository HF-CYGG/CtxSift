from .config import load_config


def route_request(path: str) -> str:
    config = load_config()
    return f"{config['prefix']}:{path}"
