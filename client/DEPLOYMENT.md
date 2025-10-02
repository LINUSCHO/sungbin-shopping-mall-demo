# Vercel 배포용 설정

## 환경 변수 설정
Vercel 대시보드에서 다음 환경 변수를 설정하세요:

```
VITE_API_URL=https://your-cloudtype-server-url.com
VITE_CLOUDINARY_CLOUD_NAME=demo
VITE_CLOUDINARY_UPLOAD_PRESET=unsigned
```

## 배포 설정
- **프레임워크**: Vite
- **빌드 명령어**: `npm run build`
- **출력 디렉토리**: `dist`
- **Node.js 버전**: 18+

## 주의사항
- Server 배포 완료 후 API URL을 환경 변수에 설정
- Cloudinary 설정이 올바른지 확인
