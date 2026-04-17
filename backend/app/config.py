from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Sino Operating Layer"
    app_env: str = "development"
    app_port: int = 8000

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/sino_operating_layer"

    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440

    anthropic_api_key: str = ""
    openai_api_key: str = ""

    cors_origins: str = "http://localhost:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
