from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import os

app = FastAPI(title="AfCEN Document Extraction Sidecar")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "afcen-extract"}


@app.post("/extract")
async def extract_document(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    suffix = os.path.splitext(file.filename)[1].lower()
    allowed = {".pdf", ".docx", ".xlsx", ".txt", ".csv"}
    if suffix not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {suffix}. Allowed: {', '.join(allowed)}",
        )

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        from unstructured.partition.auto import partition

        elements = partition(filename=tmp_path)
        extracted_text = "\n\n".join(str(el) for el in elements)

        return {
            "filename": file.filename,
            "content_type": file.content_type,
            "text": extracted_text,
            "element_count": len(elements),
        }
    except ImportError:
        # Fallback if unstructured is not fully installed
        if suffix == ".pdf":
            try:
                import subprocess

                result = subprocess.run(
                    ["python3", "-c", f"""
import sys
try:
    from PyPDF2 import PdfReader
    reader = PdfReader("{tmp_path}")
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""
    print(text)
except ImportError:
    with open("{tmp_path}", "rb") as f:
        print("[PDF extraction requires PyPDF2 or unstructured[pdf]]")
"""],
                    capture_output=True,
                    text=True,
                )
                return {
                    "filename": file.filename,
                    "content_type": file.content_type,
                    "text": result.stdout or "[Could not extract text from PDF]",
                    "element_count": 0,
                }
            except Exception:
                pass

        # Plain text fallback
        try:
            text = content.decode("utf-8", errors="replace")
            return {
                "filename": file.filename,
                "content_type": file.content_type,
                "text": text,
                "element_count": 0,
            }
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Extraction failed: {str(e)}"
            )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Extraction failed: {str(e)}"
        )
    finally:
        os.unlink(tmp_path)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
