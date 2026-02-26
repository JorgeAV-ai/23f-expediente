#!/bin/bash
# Script de descarga de documentos desclasificados del 23-F
# Fuente: La Moncloa - Consejo de Ministros

BASE="https://www.lamoncloa.gob.es/consejodeministros/Documents/2026/desclasificacion-documentos-23F"
OUTDIR="public/documents"

echo "═══════════════════════════════════════════════"
echo " Descargando documentos desclasificados 23-F"
echo " Fuente: La Moncloa"
echo "═══════════════════════════════════════════════"

download() {
  local url="$1"
  local dest="$2"
  if [ -f "$dest" ]; then
    echo "  [SKIP] $(basename "$dest") (ya existe)"
  else
    echo "  [DOWN] $(basename "$dest")"
    curl -sL -o "$dest" "$url"
    if [ $? -ne 0 ]; then
      echo "  [FAIL] $(basename "$dest")"
      rm -f "$dest"
    fi
  fi
}

# ═══ INTERIOR / GUARDIA CIVIL ═══
echo ""
echo "► Interior / Guardia Civil (11 docs)"
GC="$BASE/interior/guardia-civil"
download "$GC/23F_1._Conversacion_telefonica_GARCIA_CARRES_y_Tcol._TEJERO.pdf" "$OUTDIR/interior/guardia-civil/23F_1_conversacion_gc_tejero.pdf"
download "$GC/23F_2._Conversacion_telefonica_GARCIA_CARRES.pdf" "$OUTDIR/interior/guardia-civil/23F_2_conversacion_gc.pdf"
download "$GC/23F_3._Conversaciones_telefonicas_unidad_militar_El_Pardo.pdf" "$OUTDIR/interior/guardia-civil/23F_3_conversaciones_el_pardo.pdf"
download "$GC/23F_4._Documento_planificacion_del_golpe.pdf" "$OUTDIR/interior/guardia-civil/23F_4_planificacion_golpe.pdf"
download "$GC/23F_5._Documento_manuscrito_planificacion_del_golpe.pdf" "$OUTDIR/interior/guardia-civil/23F_5_manuscrito_planificacion.pdf"
download "$GC/23F6TR_1.PDF" "$OUTDIR/interior/guardia-civil/23F_6_esposa_tejero.pdf"
download "$GC/23F_7._Notas_Informativas_2_Seccion_EM_desarrollo_hechos.pdf" "$OUTDIR/interior/guardia-civil/23F_7_notas_informativas_em.pdf"
download "$GC/23F_8._Telex_interiores_y_de_Agencias_recibidos_en_2_Seccion_EM.pdf" "$OUTDIR/interior/guardia-civil/23F_8_telex_interiores.pdf"
download "$GC/23F_9._Oficio_dimanante_Zona_del_Pais_Vasco_disposiciones_sobre_Tejero.pdf" "$OUTDIR/interior/guardia-civil/23F_9_oficio_pais_vasco_tejero.pdf"
download "$GC/23F_10._Nota_comparecencia_Tejero_Galaxia.pdf" "$OUTDIR/interior/guardia-civil/23F_10_tejero_galaxia.pdf"
download "$GC/23F_11._Nota_Informativa_repercusion_prensa_arresto_Tejero_antes_1981.pdf" "$OUTDIR/interior/guardia-civil/23F_11_prensa_arresto_tejero.pdf"

# ═══ INTERIOR / POLICÍA ═══
echo ""
echo "► Interior / Policía (10 docs)"
POL="$BASE/interior/policia"
download "$POL/SITUACION_REGIONES_POLICIALES_24-02-81.pdf" "$OUTDIR/interior/policia/situacion_regiones_24-02-81.pdf"
download "$POL/SITUACION_REGIONES_POLICIALES_25-02-81.pdf" "$OUTDIR/interior/policia/situacion_regiones_25-02-81.pdf"
download "$POL/SITUACION_REGIONES_POLICIALES_26-02-81.pdf" "$OUTDIR/interior/policia/situacion_regiones_26-02-81.pdf"
download "$POL/12-03-81_NOTA_INFORMATIVA_SOBRE_FUERZA_NUEVA.pdf" "$OUTDIR/interior/policia/nota_fuerza_nueva_12-03-81.pdf"
download "$POL/18-03-81_NOTA_INFORMATIVA_SOBRE_LA_AYUDA_A_LOS_IMPLICADOS_23F.pdf" "$OUTDIR/interior/policia/nota_ayuda_implicados_18-03-81.pdf"
download "$POL/18-03-81_NOTA_INFORMATIVA_SOBRE_LA_OPERACION_ARIETE.pdf" "$OUTDIR/interior/policia/nota_operacion_ariete_18-03-81.pdf"
download "$POL/27-03-81_NOTA_INFORMATIVA_SOBRE_BLOQUEO_DE_CUENTA_DE_ASOC_DE_MUJERES_DE_MILITARES.pdf" "$OUTDIR/interior/policia/nota_mujeres_militares_27-03-81.pdf"
download "$POL/11-05-81_NOTA_INFORMATIVA_SOBRE_EL_PCE.pdf" "$OUTDIR/interior/policia/nota_pce_11-05-81.pdf"
download "$POL/13-05_1.PDF" "$OUTDIR/interior/policia/nota_psoe_13-05-81.pdf"
download "$POL/10-05-83_NOTA_INFORMATIVA_SOBRE_APOYO_ECONOMICO_A_LOS_IMPLICADOS.pdf" "$OUTDIR/interior/policia/nota_apoyo_economico_10-05-83.pdf"

# ═══ INTERIOR / ARCHIVO ═══
echo ""
echo "► Interior / Archivo (7 docs)"
ARCH="$BASE/interior/archivo"
download "$ARCH/1_PN_Informe_Situacion_12-11-81_desp.pdf" "$OUTDIR/interior/archivo/informe_situacion_policia_12-11-81.pdf"
download "$ARCH/2_Indices_de_subversion_en_las_FAS_DIC_1981.pdf" "$OUTDIR/interior/archivo/indices_subversion_fas_dic_1981.pdf"
download "$ARCH/3_Juicio_del_23-F_desp.pdf" "$OUTDIR/interior/archivo/juicio_23f_acotaciones.pdf"
download "$ARCH/4_campana_contra_SM.pdf" "$OUTDIR/interior/archivo/campana_contra_sm.pdf"
download "$ARCH/5_INVOLUCIONISMO_POLITICO_PROVOCADO_POSIBLE_GOLPE_MILITAR_desp.pdf" "$OUTDIR/interior/archivo/involucionismo_golpe_militar.pdf"
download "$ARCH/6_POSIBLE_GOLPE_DE_ESTADO_desp.pdf" "$OUTDIR/interior/archivo/posible_golpe_estado.pdf"
download "$ARCH/7_Notas_1983_desp.pdf" "$OUTDIR/interior/archivo/notas_1983_libertad_condenados.pdf"

# ═══ DEFENSA / CNI ═══
echo ""
echo "► Defensa / CNI (84 docs)"
CNI="$BASE/defensa/cni"
for i in $(seq 1 84); do
  download "$CNI/Documento_${i}_R.pdf" "$OUTDIR/defensa/cni/documento_${i}.pdf"
done

# ═══ DEFENSA / ARCHIVO GENERAL ═══
echo ""
echo "► Defensa / Archivo General (24 docs)"
DEF="$BASE/defensa"

# Causa 94/81
download "$DEF/Causa_9481_Reservado_parte_por_abandono_de_destino_del_Cap_Sanchez_Valiente.pdf" "$OUTDIR/defensa/archivo-general/causa_9481_abandono_sanchez_valiente.pdf"
download "$DEF/Causa_9481_Reservado_Hoja_de_servicios_del_Cap_Sanchez_Valiente.pdf" "$OUTDIR/defensa/archivo-general/causa_9481_hoja_servicios_sanchez_valiente.pdf"
download "$DEF/Causa_9481_reservado_Informe_de_Asesoria_Juridica_General_sobre_situacion_administrativa_del_Cap_Sanchez_Valiente.pdf" "$OUTDIR/defensa/archivo-general/causa_9481_informe_juridico_sanchez_valiente.pdf"

# Carpeta 21800
download "$DEF/Carpeta_21800_Secreto_oficio_dando_cuenta_toma_de_declaracion_1.pdf" "$OUTDIR/defensa/archivo-general/carpeta_21800_declaracion_1.pdf"
download "$DEF/Carpeta_21800_Secreto_oficio_dando_cuenta_toma_de_declaracion_2.pdf" "$OUTDIR/defensa/archivo-general/carpeta_21800_declaracion_2.pdf"
download "$DEF/Carpeta_21800_Reservado_oficio_dando_cuenta_toma_de_declaracion_3.pdf" "$OUTDIR/defensa/archivo-general/carpeta_21800_declaracion_3.pdf"
download "$DEF/Carpeta_21800_Reservado_oficio_dando_cuenta_toma_de_declaracion_4.pdf" "$OUTDIR/defensa/archivo-general/carpeta_21800_declaracion_4.pdf"
download "$DEF/Carpeta_21800_Reservado_comunicacion_del_procesamiento_de_Milans.pdf" "$OUTDIR/defensa/archivo-general/carpeta_21800_procesamiento_milans.pdf"
download "$DEF/Carpeta_21800_Reservado_comunicacion_procesamiento_de_implicado_1.pdf" "$OUTDIR/defensa/archivo-general/carpeta_21800_procesamiento_implicado_1.pdf"
download "$DEF/Carpeta_21800_Reservado_comunicacion_procesamiento_de_implicado_2.pdf" "$OUTDIR/defensa/archivo-general/carpeta_21800_procesamiento_implicado_2.pdf"
download "$DEF/Carpeta_21800_Reservado_comunicacion_procesamiento_de_implicado_3.pdf" "$OUTDIR/defensa/archivo-general/carpeta_21800_procesamiento_implicado_3.pdf"
download "$DEF/Carpeta_21800_Reservado_comunicacion_procesamiento_de_implicado_4.pdf" "$OUTDIR/defensa/archivo-general/carpeta_21800_procesamiento_implicado_4.pdf"
download "$DEF/Carpeta_21800_Reservado_comunicacion_procesamiento_de_implicado_5.pdf" "$OUTDIR/defensa/archivo-general/carpeta_21800_procesamiento_implicado_5.pdf"
download "$DEF/Carpeta_21800_Reservado_comunicacion_procesamiento_de_implicado_6.pdf" "$OUTDIR/defensa/archivo-general/carpeta_21800_procesamiento_implicado_6.pdf"
download "$DEF/Carpeta_21800_Secreto_comunicacion_procesamiento_de_implicado_1.pdf" "$OUTDIR/defensa/archivo-general/carpeta_21800_procesamiento_implicado_s1.pdf"
download "$DEF/Carpeta_21800_Secreto_comunicacion_procesamiento_de_implicado_2.pdf" "$OUTDIR/defensa/archivo-general/carpeta_21800_procesamiento_implicado_s2.pdf"
download "$DEF/Carpeta_21800_Secreto_traslado_de_peticiones_de_los_Abogados_de_los_condenados.pdf" "$OUTDIR/defensa/archivo-general/carpeta_21800_peticiones_abogados.pdf"
download "$DEF/Carpeta_21800_Secreto_informe_juridico_sobre_recurso_contra_la_desestimacion_de_la_recusacion_del_Ministro_de_Defensa.pdf" "$OUTDIR/defensa/archivo-general/carpeta_21800_informe_recusacion.pdf"

# Carpeta 21801
download "$DEF/Carpeta_21801_Secreto_comunicando_sancion_a_consejeros_del_Consejo_Supremo_de_Justicia_Militar.pdf" "$OUTDIR/defensa/archivo-general/carpeta_21801_sancion_consejeros.pdf"

# Carpeta 21802
download "$DEF/Carpeta_21802_Secreto_comunicando_levantamiento_de_incomunicacion_de_Tejero.pdf" "$OUTDIR/defensa/archivo-general/carpeta_21802_incomunicacion_tejero.pdf"
download "$DEF/Carpeta_21802_Secreto_copita_de_telex_dando_instrucciones_sobre_medidas_de_seguridad_con_las_visitas_a_Tejero.pdf" "$OUTDIR/defensa/archivo-general/carpeta_21802_seguridad_visitas_tejero.pdf"

# Carpeta 21804
download "$DEF/Carpeta_21804_Reservado_dacion_en_cuenta_de_recurso_de_queja_de_Milans_del_Bosch_sobre_su_detencion.pdf" "$OUTDIR/defensa/archivo-general/carpeta_21804_queja_milans.pdf"
download "$DEF/Carpeta_21804_Secreto_informacion_sobre_circunstancias_de_la_detencion_de_Milans_del_Bosch.pdf" "$OUTDIR/defensa/archivo-general/carpeta_21804_detencion_milans.pdf"
download "$DEF/Carpeta_21804_Secreto_distribucion_de_los_procesados_por_la_Causa_2_81_en_diferentes_Unidades_militares_durante_el_juicio.pdf" "$OUTDIR/defensa/archivo-general/carpeta_21804_distribucion_procesados.pdf"

# ═══ EXTERIORES ═══
echo ""
echo "► Exteriores (31 docs — PDFs y JPGs)"
EXT="$BASE/exteriores"

# AGMAE-R39017
download "$EXT/AGMAE-R39017/D.1._AGMAE_R39017_Exp._4.pdf" "$OUTDIR/exteriores/AGMAE-R39017/D1.pdf"
download "$EXT/AGMAE-R39017/D.2._AGMAE_R39017_Exp._4.jpg" "$OUTDIR/exteriores/AGMAE-R39017/D2.jpg"
download "$EXT/AGMAE-R39017/D.3._AGMAE_R39017_Exp._4.pdf" "$OUTDIR/exteriores/AGMAE-R39017/D3.pdf"
download "$EXT/AGMAE-R39017/D.4._AGMAE_R39017_Exp._4.jpg" "$OUTDIR/exteriores/AGMAE-R39017/D4.jpg"
download "$EXT/AGMAE-R39017/D.5._AGMAE_R39017_Exp._4.jpg" "$OUTDIR/exteriores/AGMAE-R39017/D5.jpg"
download "$EXT/AGMAE-R39017/D.6._AGMAE_R39017_Exp.4.jpg" "$OUTDIR/exteriores/AGMAE-R39017/D6.jpg"
download "$EXT/AGMAE-R39017/D.7._AGMAE_R39017_Exp._4.jpg" "$OUTDIR/exteriores/AGMAE-R39017/D7.jpg"
download "$EXT/AGMAE-R39017/D.8._AGMAE_R39017_Exp._4.pdf" "$OUTDIR/exteriores/AGMAE-R39017/D8.pdf"
download "$EXT/AGMAE-R39017/D.9._AGMAE_R39017_Exp._4.jpg" "$OUTDIR/exteriores/AGMAE-R39017/D9.jpg"
download "$EXT/AGMAE-R39017/D.10._AGMAE_R39017_Exp._4.jpg" "$OUTDIR/exteriores/AGMAE-R39017/D10.jpg"
download "$EXT/AGMAE-R39017/D.11._AGMAE_R39017_Exp._4.jpg" "$OUTDIR/exteriores/AGMAE-R39017/D11.jpg"
download "$EXT/AGMAE-R39017/D.12._AGMAE_R39017_Exp._4.jpg" "$OUTDIR/exteriores/AGMAE-R39017/D12.jpg"
download "$EXT/AGMAE-R39017/D.13._AGMAE_R39017_Exp._4.jpg" "$OUTDIR/exteriores/AGMAE-R39017/D13.jpg"
download "$EXT/AGMAE-R39017/D.14._AGMAE_R39017_Exp._4.pdf" "$OUTDIR/exteriores/AGMAE-R39017/D14.pdf"

# AGMAE-40201
download "$EXT/AGMAE-40201/D.15._AGMAE_R40201_Exp._215.pdf" "$OUTDIR/exteriores/AGMAE-40201/D15.pdf"
download "$EXT/AGMAE-40201/D.16._AGMAE_R40201_Exp._215.jpg" "$OUTDIR/exteriores/AGMAE-40201/D16.jpg"
download "$EXT/AGMAE-40201/D.17._AGMAE_R40201_Exp._215.jpg" "$OUTDIR/exteriores/AGMAE-40201/D17.jpg"

# AGA-83-07633
download "$EXT/AGA-83-07633/D.18._AGA-83-07633_exp._4.pdf" "$OUTDIR/exteriores/AGA-83-07633/D18.pdf"
download "$EXT/AGA-83-07633/D.19._AGA-83-07633_exp._4.pdf" "$OUTDIR/exteriores/AGA-83-07633/D19.pdf"
download "$EXT/AGA-83-07633/D.20._AGA-83-07633_exp._4.pdf" "$OUTDIR/exteriores/AGA-83-07633/D20.pdf"
download "$EXT/AGA-83-07633/D.21._AGA-83-07633_exp._4.pdf" "$OUTDIR/exteriores/AGA-83-07633/D21.pdf"
download "$EXT/AGA-83-07633/D.22._AGA-83-07633_exp._4.pdf" "$OUTDIR/exteriores/AGA-83-07633/D22.pdf"
download "$EXT/AGA-83-07633/D.23._AGA-83-07633_exp._4.pdf" "$OUTDIR/exteriores/AGA-83-07633/D23.pdf"
download "$EXT/AGA-83-07633/D.24._AGA-83-07633_exp._4.pdf" "$OUTDIR/exteriores/AGA-83-07633/D24.pdf"

# AGA-83-08764
download "$EXT/AGA-83-08764/D.25._AGA-83-08764_exp._5.pdf" "$OUTDIR/exteriores/AGA-83-08764/D25.pdf"

# AGA-83-09301
download "$EXT/AGA-83-09301/D.26._AGA-83-09301_exp._5.pdf" "$OUTDIR/exteriores/AGA-83-09301/D26.pdf"
download "$EXT/AGA-83-09301/D.27._AGA-83-09301_exp._5.pdf" "$OUTDIR/exteriores/AGA-83-09301/D27.pdf"
download "$EXT/AGA-83-09301/D.28._AGA-83-09301_exp._5.pdf" "$OUTDIR/exteriores/AGA-83-09301/D28.pdf"
download "$EXT/AGA-83-09301/D.29._AGA-83-09301_exp._5.pdf" "$OUTDIR/exteriores/AGA-83-09301/D29.pdf"
download "$EXT/AGA-83-09301/D.30._AGA-83-09301_exp._5.pdf" "$OUTDIR/exteriores/AGA-83-09301/D30.pdf"
download "$EXT/AGA-83-09301/D.31._AGA-83-09301_exp._5.pdf" "$OUTDIR/exteriores/AGA-83-09301/D31.pdf"

echo ""
echo "═══════════════════════════════════════════════"
echo " Descarga completada"
echo "═══════════════════════════════════════════════"

# Count downloaded files
TOTAL=$(find "$OUTDIR" -name "*.pdf" -o -name "*.jpg" | wc -l | tr -d ' ')
echo " Total archivos descargados: $TOTAL"
