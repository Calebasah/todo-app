# Dockerized Full-Stack To-Do List Application

A simple yet complete **full-stack To-Do List app** built with **React (Vite)** + **Node.js/Express** + **PostgreSQL**, fully containerized using **Docker** and orchestrated with **Docker Compose**.

This project demonstrates:
- Multi-container architecture
- Multi-stage Docker builds for optimization
- Internal networking & service discovery
- Persistent data with volumes
- Reproducible builds with `npm ci` and `package-lock.json`

Pushed images are available on Docker Hub:
- Frontend: [calebasah/todo-frontend](https://hub.docker.com/r/calebasah/todo-frontend)
- Backend: [calebasah/todo-backend](https://hub.docker.com/r/calebasah/todo-backend)

## Features

- Add, view, toggle (complete/uncomplete), and delete tasks
- Real-time persistence in PostgreSQL
- Responsive, clean UI
- Full Docker containerization for easy deployment


## Project Architecture

3-tier full-stack application running in separate containers:

- **Frontend** → React + Vite → Served by Nginx
- **Backend** → Node.js + Express API
- **Database** → PostgreSQL

Communication flow:
- Browser → Frontend (port 3000)
- Frontend → Backend API (internal network)
- Backend → Database (via service name `db`)


