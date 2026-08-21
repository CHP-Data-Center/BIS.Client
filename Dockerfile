# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package management files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application source code
COPY . .

# Địa chỉ API nhúng vào bundle lúc build (Vite không đọc biến lúc chạy).
# Mặc định là ĐƯỜNG DẪN TƯƠNG ĐỐI: nginx trong chính image này chuyển tiếp /api/ sang
# backend, nên mở trang bằng localhost, IP nội bộ hay tên miền công khai đều chạy mà
# không phải build lại. Chỉ đặt URL tuyệt đối khi backend nằm ở máy khác:
#   docker compose build --build-arg VITE_API_BASE_URL=https://bis-api.example.com/api/v1
ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build production bundle
RUN npm run build

# Stage 2: Production stage using Nginx
FROM nginx:alpine

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts from Stage 1
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
