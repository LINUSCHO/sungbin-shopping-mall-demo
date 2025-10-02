# CloudType 배포용 설정 파일

## 배포 설정
- **빌드 타입**: Dockerfile
- **런타임**: Node.js 18
- **포트**: 5001
- **시작 명령어**: `node src/index.js`

## 환경 변수
CloudType 대시보드에서 다음 환경 변수를 설정하세요:

```
MONGO_URI=mongodb+srv://gyehyung3346:c1g2h30416@cluster0.jfb76nj.mongodb.net/shopping-mall-demo
PORT=5001
NODE_ENV=production
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-jwt-refresh-secret
```

## 주의사항
1. **MongoDB Atlas IP 화이트리스트**: CloudType 서버 IP를 MongoDB Atlas에 추가
2. **CORS 설정**: 클라이언트 도메인을 허용하도록 설정
3. **포트 설정**: CloudType에서 자동 할당되는 포트 사용

## 배포 후 확인
- `/health` 엔드포인트 테스트
- API 엔드포인트 동작 확인
- MongoDB 연결 상태 확인
