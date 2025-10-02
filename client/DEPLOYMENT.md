# Vercel 배포용 설정

## 환경 변수 설정
Vercel 대시보드에서 다음 환경 변수를 설정하세요:

```
VITE_API_URL=https://port-0-sungbin-shopping-mall-demo-mg9ojs3l4b2698ce.sel3.cloudtype.app
VITE_CLOUDINARY_CLOUD_NAME=demo
VITE_CLOUDINARY_UPLOAD_PRESET=unsigned
```

**설정 방법:**
1. Vercel 대시보드 → 프로젝트 선택
2. Settings → Environment Variables
3. Name: `VITE_API_URL`
4. Value: `https://port-0-sungbin-shopping-mall-demo-mg9ojs3l4b2698ce.sel3.cloudtype.app`
5. Environment: Production, Preview, Development 모두 선택
6. Save

## 배포 설정
- **프레임워크**: Vite
- **빌드 명령어**: `npm run build`
- **출력 디렉토리**: `dist`
- **Node.js 버전**: 18+

## 배포 후 확인사항
- [ ] 사이트 접속 가능
- [ ] API 연결 정상 (CloudType 서버와 연결)
- [ ] 로그인 기능 정상
- [ ] 상품 목록 표시
- [ ] 장바구니 기능 정상

## 문제 해결
**404 오류 발생 시:**
1. 환경 변수 `VITE_API_URL` 설정 확인
2. CloudType 서버 상태 확인
3. CORS 설정 확인
4. 재배포 시도
