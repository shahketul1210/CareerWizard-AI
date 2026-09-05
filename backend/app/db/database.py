from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False)
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
import json

@compiles(ARRAY, "sqlite")
def compile_array_sqlite(type_, compiler, **kw):
    return "JSON"

_orig_array_bind = ARRAY.bind_processor
def _array_bind_processor(self, dialect):
    if dialect.name == "sqlite":
        return lambda value: json.dumps(value) if value is not None else None
    return _orig_array_bind(self, dialect)

_orig_array_result = ARRAY.result_processor
def _array_result_processor(self, dialect, coltype):
    if dialect.name == "sqlite":
        return lambda value: json.loads(value) if value is not None else None
    return _orig_array_result(self, dialect, coltype)

ARRAY.bind_processor = _array_bind_processor
ARRAY.result_processor = _array_result_processor

@compiles(JSONB, "sqlite")
def compile_jsonb_sqlite(type_, compiler, **kw):
    return "JSON"

_orig_jsonb_bind = JSONB.bind_processor
def _jsonb_bind_processor(self, dialect):
    if dialect.name == "sqlite":
        return lambda value: json.dumps(value) if value is not None else None
    return _orig_jsonb_bind(self, dialect)

_orig_jsonb_result = JSONB.result_processor
def _jsonb_result_processor(self, dialect, coltype):
    if dialect.name == "sqlite":
        return lambda value: json.loads(value) if value is not None else None
    return _orig_jsonb_result(self, dialect, coltype)

JSONB.bind_processor = _jsonb_bind_processor
JSONB.result_processor = _jsonb_result_processor

@compiles(UUID, "sqlite")
def compile_uuid_sqlite(type_, compiler, **kw):
    return "TEXT"

_orig_uuid_bind = UUID.bind_processor
def _uuid_bind_processor(self, dialect):
    orig = _orig_uuid_bind(self, dialect)
    def process(value):
        if value is None:
            return None
        if dialect.name == "sqlite":
            if hasattr(value, "hex"):
                return value.hex
            if isinstance(value, str):
                cleaned = value.replace("-", "").strip()
                if len(cleaned) == 32:
                    return cleaned
                return value
            return str(value)
        if isinstance(value, str):
            import uuid as _uuid
            try:
                value = _uuid.UUID(value)
            except Exception:
                return value
        return orig(value) if orig else value
    return process

UUID.bind_processor = _uuid_bind_processor

_orig_uuid_result = UUID.result_processor
def _uuid_result_processor(self, dialect, coltype):
    if dialect.name == "sqlite":
        if self.as_uuid:
            import uuid as _uuid
            def process(value):
                if value is None:
                    return None
                try:
                    return _uuid.UUID(str(value))
                except Exception:
                    return value
            return process
        return lambda value: str(value) if value is not None else None
    return _orig_uuid_result(self, dialect, coltype)

UUID.result_processor = _uuid_result_processor

Base = declarative_base()
 

def get_db():
	"""FastAPI dependency that yields a DB session and ensures it's closed."""
	db = SessionLocal()
	try:
		yield db
	finally:
		db.close()

