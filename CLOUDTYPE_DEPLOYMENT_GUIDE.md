# CloudType 배포 설정 가이드

## 배포 설정
CloudType 대시보드에서 다음 설정을 확인하세요:

### 1. 빌드 타입 설정
- **빌드 타입**: `Dockerfile` 선택 (자동 감지가 아닌 명시적 선택)
- **Dockerfile 경로**: `./Dockerfile` (루트 디렉토리)

### 2. 환경 변수 설정
```
MONGO_URI=mongodb+srv://gyehyung3346:c1g2h30416@cluster0.jfb76nj.mongodb.net/shopping-mall-demo
PORT=5001
NODE_ENV=production
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-jwt-refresh-secret
IAMPORT_API_KEY=your-iamport-api-key
IAMPORT_API_SECRET=your-iamport-api-secret
```

### 3. 빌드 설정
- **빌드 명령어**: 자동 (Dockerfile 사용)
- **시작 명령어**: 자동 (Dockerfile의 CMD 사용)
- **포트**: 5001

## 문제 해결
만약 여전히 오류가 발생한다면:

1. **빌드 타입 재설정**: CloudType에서 빌드 타입을 `Dockerfile`로 명시적 설정
2. **Dockerfile 확인**: 루트 디렉토리에 `Dockerfile` 존재 확인
3. **캐시 클리어**: CloudType에서 빌드 캐시 클리어 후 재배포

## 주의사항
- MongoDB Atlas IP 화이트리스트에 CloudType 서버 IP 추가 필요
- CORS 설정이 클라이언트 도메인을 허용하도록 확인
- 환경 변수가 올바르게 설정되었는지 확인
