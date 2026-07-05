from app.routes import route_request


def test_route_request():
    assert route_request("/health") == "api:/health"
