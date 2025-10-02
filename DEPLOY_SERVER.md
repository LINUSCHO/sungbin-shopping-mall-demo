# Server 배포 가이드 (CloudType)

## 환경 변수 설정
```
MONGO_URI=mongodb+srv://gyehyung3346:c1g2h30416@cluster0.jfb76nj.mongodb.net/shopping-mall-demo
PORT=5001
NODE_ENV=production
```

## 빌드 설정
- 빌드 명령: npm install
- 시작 명령: npm start
- 루트 디렉토리: server

## 확인사항
- MongoDB Atlas 연결 확인
- CORS 설정 확인 (모든 도메인 허용)
- 포트 5001 사용
