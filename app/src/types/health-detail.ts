export type HealthDetailCheck = {
  status: "up" | "down";
  configured?: boolean;
  storage?: "redis" | "memory";
  message?: string;
};

export type HealthDetailResponse = {
  status: "ok" | "degraded";
  timestamp: string;
  environment: string;
  checks: {
    database: HealthDetailCheck;
    redis: HealthDetailCheck;
    rateLimitStorage: "redis" | "memory";
  };
};
