from __future__ import annotations

from fastapi import APIRouter, Form, HTTPException, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates

from app.services.dummy_data import data_service


router = APIRouter()
templates = Jinja2Templates(directory="app/templates")


def render(request: Request, template_name: str, active_page: str, **context: object) -> HTMLResponse:
    return templates.TemplateResponse(
        request,
        template_name,
        {
            "active_page": active_page,
            "latest_sensor": data_service.get_latest_sensor(),
            "device_status": data_service.get_device_status(),
            **context,
        },
    )


@router.get("/", response_class=HTMLResponse)
def root(request: Request) -> HTMLResponse:
    return templates.TemplateResponse(request, "login.html", {"active_page": "login"})


@router.post("/login")
def login(username: str = Form(...), password: str = Form(...)) -> RedirectResponse:
    if not username or not password:
        raise HTTPException(status_code=400, detail="Username dan password wajib diisi")
    return RedirectResponse(url="/dashboard", status_code=303)


@router.get("/dashboard", response_class=HTMLResponse)
def dashboard(request: Request) -> HTMLResponse:
    return render(
        request,
        "dashboard.html",
        "dashboard",
        fuzzy=data_service.get_latest_fuzzy_result(),
        vision=data_service.get_latest_vision_result(),
        pump_logs=data_service.get_pump_logs(),
    )


@router.get("/monitoring", response_class=HTMLResponse)
def monitoring(request: Request) -> HTMLResponse:
    return render(request, "monitoring.html", "monitoring", history=data_service.get_sensor_history())


@router.get("/control", response_class=HTMLResponse)
def control(request: Request) -> HTMLResponse:
    return render(
        request,
        "control.html",
        "control",
        fuzzy=data_service.get_latest_fuzzy_result(),
        pump_logs=data_service.get_pump_logs(),
    )


@router.get("/vision", response_class=HTMLResponse)
def vision(request: Request) -> HTMLResponse:
    return render(
        request,
        "vision.html",
        "vision",
        vision=data_service.get_latest_vision_result(),
        vision_history=data_service.get_vision_history(),
    )


@router.get("/fuzzy", response_class=HTMLResponse)
def fuzzy(request: Request) -> HTMLResponse:
    return render(
        request,
        "fuzzy.html",
        "fuzzy",
        fuzzy=data_service.get_latest_fuzzy_result(),
        fuzzy_history=data_service.get_fuzzy_history(),
    )


@router.get("/settings", response_class=HTMLResponse)
def settings(request: Request) -> HTMLResponse:
    return render(request, "settings.html", "settings")
