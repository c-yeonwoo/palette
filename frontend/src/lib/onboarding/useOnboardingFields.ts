/**
 * 온보딩 필드 메타 훅 (ADR 0058 3b) — "가벼운 메타 적용".
 *
 * GET /api/v1/onboarding/fields 로 어드민이 관리하는 활성 필드 메타를 받아,
 * 기존 온보딩 화면(위젯·미니스텝 구조 유지)에 **라벨·힌트·노출·필수 여부**만 구동한다.
 *
 * 안전 규칙:
 *  · API 성공(loaded=true): 응답에 있는 field_key 만 노출(visible). 없는 알려진 필드는 숨김(admin 비활성).
 *    label/hint/required 는 메타값 사용.
 *  · API 실패/미로딩(loaded=false): 폴백 — 모든 필드 visible=true, 화면이 넘긴 현행 기본값 그대로.
 *    → 네트워크 의존 없이 가입 플로우가 항상 동작(회귀 0).
 */
import { useEffect, useState } from "react";
import { api } from "../api/apiClient";

export interface OnboardingFieldMeta {
  fieldKey: string;
  label: string;
  hint: string | null;
  inputType: string;
  optionSetKey: string | null;
  required: boolean;
  config: Record<string, unknown> | null;
}

interface RawField {
  fieldKey: string;
  label: string;
  hint: string | null;
  inputType: string;
  optionSetKey: string | null;
  required: boolean;
  config: string | null;
}
interface RawSection { key: string; label: string; order: number; fields: RawField[] }
interface FieldsResponse { sections?: RawSection[] }

function parseConfig(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try { return JSON.parse(raw) as Record<string, unknown>; } catch { return null; }
}

export interface OnboardingFieldsApi {
  loaded: boolean;
  byKey: Record<string, OnboardingFieldMeta>;
  /** 메타 라벨(로딩 성공 시) 우선, 없으면 fallback */
  label: (key: string, fallback: string) => string;
  /** 로딩 성공 시 메타 힌트(없으면 null), 미로딩 시 fallback */
  hint: (key: string, fallback?: string) => string | undefined;
  /** 로딩 성공 시 메타 required, 미로딩 시 fallback(현행) */
  required: (key: string, fallback: boolean) => boolean;
  /** 로딩 성공 시 활성 목록에 있으면 노출, 미로딩 시 항상 노출 */
  visible: (key: string) => boolean;
  config: (key: string) => Record<string, unknown> | null;
}

export function useOnboardingFields(): OnboardingFieldsApi {
  const [byKey, setByKey] = useState<Record<string, OnboardingFieldMeta>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<FieldsResponse>("/api/v1/onboarding/fields");
        const sections = res?.sections;
        if (!cancelled && Array.isArray(sections)) {
          const map: Record<string, OnboardingFieldMeta> = {};
          for (const sec of sections) {
            for (const f of sec.fields ?? []) {
              map[f.fieldKey] = {
                fieldKey: f.fieldKey, label: f.label, hint: f.hint,
                inputType: f.inputType, optionSetKey: f.optionSetKey,
                required: f.required, config: parseConfig(f.config),
              };
            }
          }
          // 빈 응답이면 폴백 유지(loaded=false 로 두지 않고, 비어도 loaded=true 로 두면 전부 숨겨짐 → 위험)
          if (Object.keys(map).length > 0) {
            setByKey(map);
            setLoaded(true);
          }
        }
      } catch {
        // 폴백 유지 — 가입 플로우 항상 동작
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return {
    loaded,
    byKey,
    label: (key, fallback) => byKey[key]?.label ?? fallback,
    hint: (key, fallback) => (loaded ? (byKey[key]?.hint ?? undefined) : fallback),
    required: (key, fallback) => (loaded ? (byKey[key]?.required ?? false) : fallback),
    visible: (key) => (loaded ? key in byKey : true),
    config: (key) => byKey[key]?.config ?? null,
  };
}
