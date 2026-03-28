# TerraPlace — app React Native

Cliente móvel da mesma API do site (`web/`, Next.js).

Inclui projetos nativos **`android/`** e **`ios/`** (React Native 0.73), gerados a partir do template oficial, para poderes compilar APK/AAB e (em macOS) IPA.

- **Nome no ecrã / launcher:** TerraPlace  
- **Nome interno do módulo JS:** `MarketplaceApp` (mantido em `app.json` — tem de coincidir com `MainActivity` / `AppDelegate`)

## Requisitos

| Plataforma | Ferramentas |
|------------|-------------|
| **Android** | [Android Studio](https://developer.android.com/studio), **JDK 17** (recomendado para Gradle/RN 0.73). Evita JDK muito novo (ex.: 24) se o Gradle falhar com *Unsupported class file major version*. |
| **iOS** | macOS, Xcode, CocoaPods (`pod install` em `ios/`) |

## Instalação

```bash
cd app
npm install
```

## API base

| Ambiente | URL |
|----------|-----|
| **Produção** (release) | `https://terraplace.pt` |
| **Desenvolvimento** | Emulador Android: `http://10.0.2.2:3000` · Simulador iOS: `http://localhost:3000` |

Configuração: `src/config/api.ts`. Para telemóvel físico em dev, usa `MANUAL_DEV_API_BASE` com o IP da tua máquina (porta 3000).

### Backend local

```bash
cd web
npm install
npm run dev
```

## Correr em desenvolvimento

Terminal 1 (Metro):

```bash
cd app
npm start
```

Terminal 2:

```bash
cd app
npm run android
# ou, em macOS com Xcode:
npm run ios
```

## Build de release (Android)

Com JDK 17 configurado e variáveis Android (`ANDROID_HOME`):

```bash
cd app/android
./gradlew assembleRelease   # Linux/macOS
.\gradlew.bat assembleRelease   # Windows
```

O APK fica em `android/app/build/outputs/apk/release/`. Para **Google Play**, gera normalmente um **AAB** (`bundleRelease`).

Assinatura de release: cria keystore e configura `signingConfigs` em `android/app/build.gradle` (não commits da keystore).

## Identificadores

- **Android:** `applicationId` / `namespace` → `com.marketplaceapp` (altera antes da loja se quiseres `pt.terraplace.app`, com refactors no pacote Java/Kotlin).
- **iOS:** bundle identifier no Xcode (template padrão do projeto gerado).

## Próximos passos para lojas

- Política de privacidade (URL pública).
- Ícones e capturas de ecrã.
- Contas Google Play / Apple Developer e revisão das lojas.
