# LEGACY — Phase A 의 yaml scaffold

> 사용 금지. reference 만.

Phase A 처음 작성한 `hermes agent add <yaml>` 가정 기반 scaffold. 실제 Hermes Agent
(`~/.local/bin/hermes`) 의 모델은 **`hermes cron create --no-agent --script <bash>`**
패턴이라 yaml 들은 동작하지 않음.

새 구현: `.hermes/scripts/` 와 `.hermes/cron-setup.sh` 참고.

남겨두는 이유:
- prompt / 책임 분리 / 라벨 컨벤션 등 설계 의도가 yaml 의 주석에 잘 정리되어 있어
  새 script 의 reference 로 활용
- 향후 Hermes 가 multi-agent 추가하면 다시 사용 가능
