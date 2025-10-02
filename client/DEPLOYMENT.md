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
- **루트 디렉토리**: `client` (monorepo인 경우)

**중요**: Vercel에서 프로젝트를 import할 때:
1. **Root Directory**를 `client`로 설정
2. **Framework Preset**을 `Vite`로 선택
3. **Build Command**가 `npm run build`인지 확인
4. **Output Directory**가 `dist`인지 확인

## 배포 후 확인사항
- [ ] 사이트 접속 가능
- [ ] API 연결 정상 (CloudType 서버와 연결)
- [ ] 로그인 기능 정상
- [ ] 상품 목록 표시
- [ ] 장바구니 기능 정상

## 문제 해결

### **404 NOT_FOUND 오류**
1. **Root Directory 설정 확인**
   - Vercel 프로젝트 설정에서 Root Directory가 `client`로 설정되어 있는지 확인
   
2. **빌드 설정 확인**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Framework Preset: `Vite`

3. **환경 변수 설정 확인**
   - `VITE_API_URL` 환경 변수가 설정되어 있는지 확인
   - Production, Preview, Development 모두 선택되어 있는지 확인

4. **빌드 로그 확인**
   - Vercel 대시보드에서 빌드 로그 확인
   - 빌드가 성공적으로 완료되었는지 확인

5. **재배포 시도**
   - 환경 변수 설정 후 재배포
   - 또는 수동으로 Redeploy 실행

### **API 연결 오류**
1. CloudType 서버 상태 확인
2. CORS 설정 확인
3. 환경 변수 `VITE_API_URL` 값 확인
