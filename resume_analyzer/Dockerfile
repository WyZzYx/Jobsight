# resume_analyzer/Dockerfile
FROM python:3.11-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1

COPY resume_analyzer/requirements.txt .
RUN pip install -r requirements.txt

COPY resume_analyzer/app ./app
WORKDIR /app
EXPOSE 9000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "9000"]
