from pydantic import BaseModel, Field, model_validator


class SG(BaseModel):
    window: int = Field(..., gt=2)  # odd
    order: int = Field(..., ge=1)

    @model_validator(mode="after")
    def _v(self):
        if self.window % 2 == 0:
            raise ValueError("window must be odd")
        if self.order >= self.window:
            raise ValueError("order < window")
        return self


class ZThresh(BaseModel):
    v1: float
    v2: float
    a: float


class PhysicsModelConfigModel(BaseModel):
    sampling_interval_s: float = Field(..., gt=0)
    baseline_window_short: int = Field(..., gt=10)
    baseline_window_long: int = Field(..., gt=10)
    sg_pos: SG
    sg_vel: SG
    sg_accel: SG
    z_enter: ZThresh
    z_exit: ZThresh
    m_persist: int = Field(2, ge=1, le=10)
    ssi_crit: float = Field(9.0, gt=0)
