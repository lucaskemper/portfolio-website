### ⚠️ IN REDACTION ⚠️
# LLM-Powered Portfolio Website (this file is currently not optimised for mobile devices). 
[![Security Rating](https://img.shields.io/badge/Security-A+-success.svg)](https://lucaskemper.com)
[![Performance](https://img.shields.io/badge/Load%20Time-<100ms-brightgreen.svg)](https://lucaskemper.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

<p align="center">
  <img src="assets/images/demo.gif" alt="Portfolio Demo" width="600">
</p>

**Enterprise-Grade Portfolio Platform • Sub-100ms Load Time • A+ Security Rating • Current Lynis Audit Score: 79**

[Live Demo](https://lucaskemper.com)  

---

## 🎯 Performance Metrics (outdated)

<div align="center">

| Metric | Value | Status |
|:------:|:-----:|:------:|
| Load Time | <100ms | ✅ |
| Lighthouse Score | 100/100 | ✅ |
| First Paint | <1s | ✅ |
| Uptime SLA | 99.9% | ✅ |
| System Load | <5% | ✅ |

</div>

---

## 🏗️ Architecture Overview

```mermaid
graph TD
    subgraph Edge Security
        CF[Cloudflare Enterprise] -->|DDoS + WAF| A
        CF -->|CDN Cache| A
    end

    A[Client Browser] -->|HTTPS/2 + TLS 1.3| LB[Load Balancer Cluster]

    subgraph High Availability
        LB -->|Active-Active| HAP1[HAProxy Primary]
        LB -->|Failover| HAP2[HAProxy Secondary]
        HAP1 -->|Layer 7| NGX[Nginx 1.22.1]
        HAP2 -->|Layer 7| NGX
    end

    NGX -->|Container Orchestration| DOC[Docker Swarm]

    subgraph Container Layer
        DOC -->|App| APP[Application Stack]
        DOC -->|Metrics| PROM[Prometheus + Grafana]
        DOC -->|Logging| ELK[ELK Stack]
        DOC -->|Security| FW[ModSecurity WAF]
    end

    DOC -->|Bare Metal| E[Dedicated Server]

    subgraph Hardware Layer
        E -->|Memory| F[64GB DDR4-3200 RAM]
        E -->|Processor| G[AMD Ryzen 5 3600]
        E -->|Storage| H[1.5TB→500GB R1N3 SSD]
    end

    subgraph Monitoring & Alerts
        PROM -->|Metrics| ALERT[AlertManager]
        ELK -->|Logs| ALERT
        ALERT -->|Notification| SLACK[Email]
    end

    subgraph Backup Infrastructure
        E -.->|Backup| BORG[Borg Backup]
        BORG -.->|Daily| S3[S3 Cold Storage]
        BORG -.->|Weekly| OFF[Offsite Backup]
    end

    subgraph Security Monitoring
        SEC[Fail2Ban + CrowdSec] -->|IDS/IPS| E
        AUD[Auditd + OSSEC] -->|HIDS| E
    end
```


---

## 🚀 Feature Highlights

<details>
<summary><strong>🎨 Modern UI/UX Components</strong></summary>

- Particle.js background with dynamic interactions
- Matrix-style rain effect with canvas
- Custom animated cursor with dual-layer design
- 3D card effects with perspective transforms
</details>

<details>
<summary><strong>⚡ Performance Optimizations</strong></summary>

- Critical CSS inlining
- Preloading of key assets
- Async script loading
- WebP image optimization
</details>

<details>
<summary><strong>🛡️ Security Measures</strong></summary>

- TLS 1.3 with TLS_AES_256_GCM_SHA384
- HSTS with max-age=31536000
- Strict CSP headers
- Multi-layer WAF protection
</details>
