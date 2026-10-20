package com.retosonline.enums;

public enum CondicionExperimental {
    CERRADO_API,      // Condición 1: modelo propietario vía API (GPT/Gemini) con prompt estandarizado
    LOCAL_SIN_FT,     // Condición 2: modelo local (pesos abiertos) sin fine-tuning, mismo prompt
    LOCAL_CON_FT      // Condición 3: mismo modelo local, con fine-tuning sobre datos propios
}