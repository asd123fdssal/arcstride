package com.arcstride.common.util;

/**
 * unit_key, character_name 등의 정규화 유틸.
 * 규칙: trim + lower + 공백축약(연속공백 → 단일공백)
 */
public final class NormalizeUtil {

    private NormalizeUtil() {}

    public static String normalize(String input) {
        if (input == null) return null;
        return input.strip()
                .toLowerCase()
                .replaceAll("\\s+", " ");
    }
}
