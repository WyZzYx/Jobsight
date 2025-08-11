from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
import fitz  # PyMuPDF
from docx import Document
import io
import re

from .skill_extractor import extract_skills

app = FastAPI(title="JobSight Resume Analyzer")

def read_pdf(binary: bytes) -> str:
    text = []
    with fitz.open(stream=binary, filetype="pdf") as doc:
        for page in doc:
            text.append(page.get_text())
    return "\n".join(text)

def read_docx(binary: bytes) -> str:
    with io.BytesIO(binary) as buf:
        doc = Document(buf)
        paras = [p.text for p in doc.paragraphs]
        return "\n".join(paras)

@app.post("/analyze")
async def analyze(file: UploadFile = File(...), language: str = Form("en")):
    data = await file.read()

    name = file.filename.lower() if file.filename else "upload"
    if name.endswith(".pdf"):
        text = read_pdf(data)
    elif name.endswith(".docx"):
        text = read_docx(data)
    else:
        # Best-effort: try both, fallback to plain text
        try:
            text = read_pdf(data)
        except Exception:
            try:
                text = read_docx(data)
            except Exception:
                text = data.decode(errors="ignore")

    # Simple cleanup
    text = re.sub(r"\s+", " ", text)

    skills = extract_skills(text, language=language)
    # You can also return sections, entities, etc.
    return JSONResponse({"skills": sorted(list(set(s.lower() for s in skills)))})
