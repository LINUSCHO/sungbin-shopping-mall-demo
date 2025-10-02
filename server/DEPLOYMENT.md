# CloudType 배포용 설정

## 환경 변수 설정
CloudType 대시보드에서 다음 환경 변수를 설정하세요:

```
MONGO_URI=mongodb+srv://gyehyung3346:c1g2h30416@cluster0.jfb76nj.mongodb.net/shopping-mall-demo
PORT=5001
NODE_ENV=production
```

## 배포 설정
- **런타임**: Node.js 18+
- **빌드 명령어**: `npm install`
- **시작 명령어**: `npm start`
- **포트**: 5001 (또는 CloudType에서 자동 할당)

## 주의사항
- MongoDB Atlas IP 화이트리스트에 CloudType 서버 IP 추가 필요
- CORS 설정이 클라이언트 도메인을 허용하도록 확인
