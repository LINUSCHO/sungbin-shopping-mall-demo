# Server 배포용 Dockerfile
FROM node:18-alpine

# 작업 디렉토리 설정
WORKDIR /app

# Server 폴더의 package.json과 package-lock.json 복사
COPY server/package*.json ./

# 의존성 설치 (프로덕션 모드)
RUN npm ci --only=production && npm cache clean --force

# Server 소스 코드 복사
COPY server/src ./src

# 환경 변수 설정
ENV NODE_ENV=production
ENV PORT=5001

# 포트 노출
EXPOSE 5001

# 헬스체크 추가
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# 애플리케이션 시작
CMD ["node", "src/index.js"]
