# Rescue Network — Monitoring Infrastructure

This directory contains the production monitoring and observability setup for Rescue Network (`devops-24ESKCS089`), covering Prometheus metrics scraping and Grafana dashboard visualization.

---

## Architecture Overview

```
+--------------------+        Scrapes :5000/metrics        +--------------------+
| Rescue Network App | <================================== | Prometheus Server  |
|  (Node.js/Express) |                                     |   (Port 9090)      |
+--------------------+                                     +--------------------+
          |                                                          |
          |                                           PromQL Queries |
          v                                                          v
  /health : HTTP 200                                       +--------------------+
  /metrics: Prometheus text                                |  Grafana Dashboard |
                                                           |   (Port 3000)      |
                                                           +--------------------+
```

- **Metrics Instrumentation**: Implemented using `prom-client` in Express.js.
- **Metrics Endpoint**: `GET /metrics` exposes standard Prometheus exposition format text.
- **Health Endpoint**: `GET /health` provides lightweight container/pod readiness verification.
- **Scraper**: Prometheus v2.51.0 configured to scrape the application at 5s intervals.
- **Visualizer**: Grafana 10.4.0 pre-configured with auto-provisioned Prometheus data source and dashboard.

---

## Directory Structure

```
monitoring/
├── prometheus.yml                       # Prometheus global and scrape configuration
├── README.md                            # Documentation and operational guide
└── grafana/
    ├── dashboards/
    │   └── rescue-network-dashboard.json # Grafana dashboard definition
    └── provisioning/
        ├── dashboards/
        │   └── dashboards.yml           # Auto-provisioning dashboard provider
        └── datasources/
            └── datasources.yml          # Auto-provisioning Prometheus datasource
```

---

## Exported Metrics Reference

| Metric Name | Type | Description | Labels |
|---|---|---|---|
| `http_requests_total` | Counter | Total count of HTTP requests processed | `method`, `route`, `status_code` |
| `http_request_duration_seconds` | Histogram | Request latency distribution in seconds | `method`, `route`, `status_code`, `le` |
| `food_rescue_process_cpu_seconds_total` | Counter | Total user and system CPU time spent in seconds | — |
| `food_rescue_process_resident_memory_bytes` | Gauge | Resident memory size (RSS) in bytes | — |
| `food_rescue_nodejs_heap_size_total_bytes` | Gauge | Total V8 engine allocated heap size in bytes | — |
| `food_rescue_nodejs_heap_size_used_bytes` | Gauge | Used V8 engine heap size in bytes | — |
| `food_rescue_nodejs_active_handles` | Gauge | Count of active event loop handles | `type` |
| `food_rescue_nodejs_eventloop_lag_seconds` | Gauge | Event loop delay in seconds | — |
| `up` | Gauge | Prometheus scrape availability (1 = UP, 0 = DOWN) | `job`, `instance` |

---

## Prometheus Configuration (`monitoring/prometheus.yml`)

The Prometheus scrape configuration targets the container network service `app:5000` via:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:9090"]

  - job_name: "rescue-network-app"
    scrape_interval: 5s
    metrics_path: "/metrics"
    static_configs:
      - targets: ["app:5000"]
        labels:
          app: "rescue-network"
          environment: "production"
```

---

## Grafana Dashboard Panels

The dashboard (`rescue-network-dashboard.json`, UID: `rescue-network-mt2`) contains 8 panels:

1. **Service Status**: Visual indicator of whether the application target is UP or DOWN (`up{job="rescue-network-app"}`).
2. **Total Request Rate (RPS)**: Aggregate real-time requests per second (`sum(rate(http_requests_total[1m]))`).
3. **P95 Latency**: 95th percentile request latency histogram (`histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[1m])) by (le))`).
4. **Total Processed Requests**: Cumulative count of processed requests (`sum(http_requests_total)`).
5. **Request Rate by Route**: Time series breakdown of traffic per API route (`sum(rate(http_requests_total[1m])) by (route)`).
6. **HTTP Status Codes Breakdown**: Real-time HTTP response status codes (2xx, 4xx, 5xx).
7. **Node.js Process CPU Usage**: CPU consumption percentage over time.
8. **Node.js Memory & Heap Usage**: Process RSS, allocated heap, and consumed heap over time.

---

## Running Locally

To spin up the application along with MongoDB, Prometheus, and Grafana:

```bash
docker compose up -d
```

### Access URLs

- Application: `http://localhost:5000`
- Health check: `http://localhost:5000/health`
- Raw metrics: `http://localhost:5000/metrics`
- Prometheus UI: `http://localhost:9090`
- Grafana UI: `http://localhost:3000` (Default credentials: `admin` / `admin`)

### Verification Commands

```bash
# Verify health endpoint
curl -i http://localhost:5000/health

# Verify Prometheus metrics endpoint
curl -i http://localhost:5000/metrics

# Verify Prometheus target status
curl http://localhost:9090/api/v1/targets
```
