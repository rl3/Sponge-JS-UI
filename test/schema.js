db.Schema.remove()


db.Schema.save(
{ 
    "className" : "de.atb_potsdam.agrohyd.agroobj.Schema",
    "objectType" : "climate",
    "version" : 1,
    "description" : "Climates",
    "rgbcolor" : [
        102,
        102,
        204,
    ],
    "iteratorType" : [
        {
            "className" : "de.atb_potsdam.agrohyd.agroobj.Schema$IteratorDate",
            "type" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDate",
                "description": "Date",
            },
            "id" : "date",
            "argName" : "date",
        },
    ],
    "iteratorCondition" : function(value, lib) {
        return {
            "start.value": {$lte: value},
            "end.value": {$gte: value},
        };
    },
    "iteratorCompare" : function(v1, v2, lib) {
        return  v1.date.getTime() - v2.date.getTime();
    },
    "fixArgs" : {
        "typeMap" : {
            "name" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 0,
            },
            "max_temp" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "maximale Tagestemperatur",
                "unit" : "°C",
                "index": 1,
            },
            "min_temp" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "minimale Tagestemperatur",
                "unit" : "°C",
                "index": 2,
            },
            "mean_temp" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "durchschnittliche Tagestemperatur",
                "unit" : "°C",
                "index": 3,
            },
            "humidity" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "relative Luftfeuchte",
                "unit" : "%",
                "index": 4,
            },
            "windspeed" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "durchschnittliche Tages-Windgeschwindigkeit",
                "unit" : "m/s",
                "index": 5,
            },
            "sunshine_duration" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "Sonnenscheindauer",
                "unit" : "h",
                "index": 6,
            },
            "Rs" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "Globalstrahlung",
                "unit" : "MJ/(m²*d)",
                "index": 7,
            },
            "precipitation" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "Niederschlag",
                "unit" : "mm",
                "index": 8,
            },
            "air_pressure" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "Luftdruck",
                "unit" : "hPa",
                "index": 9,
            },
            "vapour_pressure" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "Dampfdruck",
                "unit" : "hPa",
                "index": 10,
            },
            "cloudiness" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "Bewoelkung",
                "unit" : "1/8",
                "index": 11,
            },
        }
    }
}
)

db.Schema.save(
{
    "className" : "de.atb_potsdam.agrohyd.agroobj.Schema",
    "objectType" : "plant",
    "version" : 1,
    "description" : "Plants",
    "rgbcolor" : [
        153,
        255,
        102,
    ],
    "iteratorType" : [
        {
            "className" : "de.atb_potsdam.agrohyd.agroobj.Schema$IteratorDay",
            "type" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeInteger",
                "description": "Day",
                "unit" : "d",
            },
            "id" : "day",
            "argName" : "day",
        },
    ],
    "iteratorCondition" : function(value, lib) {
        return {
            "start.value": {$lte: value},
            "end.value": {$gte: value},
        };
    },
    "iteratorCompare" : function(v1, v2, lib) {
        return  v1.day - v2.day;
    },
    "fixArgs" : {
        "typeMap" : {
            "name" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 0,
            },
            "Kc" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "crop coefficient",
                "index": 1,
            },
            "Zr" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "rooting depth",
                "unit" : "m",
                "index": 2,
            },
            "p" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "critical depletion",
                "index": 3,
            },
            "Ky" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "yield response factor",
                "index": 4,
            },
            "Ky_total" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "yield response factor",
                "index": 5,
            },
            "LAI" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "leaf area index",
                "index": 6,
            },
            "height" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "height",
                "unit" : "m",
                "index": 7,
            },
            "Kcb" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 8,
            },
            "Zr_irrigated" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "rooting depth irrigated",
                "unit" : "m",
                "index": 9,
            }
        }
    }
}
)

db.Schema.save(
{
    "className" : "de.atb_potsdam.agrohyd.agroobj.Schema",
    "objectType" : "soil",
    "version" : 1,
    "compatibleVersions" : [
        2,
        3,
    ],
    "description" : "Soils",
    "rgbcolor" : [
        153,
        102,
        0,
    ],
    "iteratorType" : [
        {
            "className" : "de.atb_potsdam.agrohyd.agroobj.Schema$IteratorZ",
            "type" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "Depth",
                "unit" : "m",
            },
            "id": "z",
            "argName" : "z",
        },
    ],
    "iteratorCondition" : function(value, lib) {
        return {
            "start.value": {$lte: value},
            "end.value": {$gt: value},
        };
    },
    "iteratorCompare" : function(v1, v2, lib) {
        return  v1.z - v2.z;
    },
    "fixArgs" : {
        "typeMap" : {
            "name" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 0,
            },
            "Qfc" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "Feldkapazitaet m³(Wasser)/m³(Boden)",
                "unit" : "none",
                "index": 1,
            },
            "Qwp" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "Welkepunkt m³(Wasser)/m³(Boden)",
                "unit" : "none",
                "index": 2,
            },
            "AWC" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "verfügbare Wassermenge je Meter Wurzeltiefe",
                "unit" : "mm/m",
                "index": 3,
            },
        }
    }
}
)

db.Schema.save(
{
    "className" : "de.atb_potsdam.agrohyd.agroobj.Schema",
    "objectType" : "soil",
    "version" : 2,
    "compatibleVersions" : [
        3,
    ],
    "description" : "Soils",
    "rgbcolor" : [
        153,
        102,
        0,
    ],
    "iteratorType" : [
        {
            "className" : "de.atb_potsdam.agrohyd.agroobj.Schema$IteratorZ",
            "type" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "Depth",
                "unit" : "m",
            },
            "id": "z",
            "argName" : "z",
        },
    ],
    "iteratorCondition" : function(value, lib) {
        return {
            "start.value": {$lte: value},
            "end.value": {$gt: value},
        };
    },
    "iteratorCompare" : function(v1, v2, lib) {
        return  v1.z - v2.z;
    },
    "fixArgs" : {
        "typeMap" : {
            "name" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 0,
            },
            "location" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "description": "Lage",
                "index": 1,
            },
            "relief" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "description": "Relief",
                "index": 2,
            },
            "precipitation" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "durchschnittlicher Jahresniederschlag",
                "unit" : "mm",
                "index": 3,
            },
            "mean_temp" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "durchschnittliche Jahrestemperatur",
                "unit" : "°C",
                "index": 4,
            },
            "usage" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "description": "Nutzung",
                "index": 5,
            },
            "vegetation" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "description": "Vegetation",
                "index": 6,
            },
            "soil_class" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "description": "Bodenklasse",
                "index": 7,
            },
            "soil_systematic_unit" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "description": "Bodensystematische Einheit",
                "index": 8,
            },
            "substrate_systematic_unit" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "description": "Substratsystematische Einheit",
                "index": 9,
            },
            "soil_form" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "description": "Bodenform",
                "index": 10,
            },
            "humus_form" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "description": "Humusform",
                "index": 11,
            },
            "groundwater_depth" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "Grundwassertiefe",
                "unit" : "cm",
                "index": 12,
            },
            "effective_rooting_depth" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "effektive Durchwurzelungstiefe",
                "unit" : "m",
                "index": 13,
            },
            "TAW" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "nutzbare Feldkapazitaet",
                "unit" : "mm",
                "index": 14,
            },
            "AZ_GLZ" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "Ackerzahl",
                "unit" : "none",
                "index": 15,
            },
            "stammfruchtbarkeitskennziffer" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "Stammfruchtbarkeitskennziffer fuer Holzmasse",
                "unit" : "(t/ha)*a",
                "index": 16,
            },
            "horizon" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "description": "Horizont",
                "index": 17,
            },
            "substrate" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "description": "Substrat",
                "index": 18,
            },
            "TRD" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "Trockenrohdichte",
                "unit" : "g/cm³",
                "index": 19,
            },
            "ton" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "Anteil Ton",
                "unit" : "%",
                "index": 20,
            },
            "schluff" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "Anteil Schluff",
                "unit" : "%",
                "index": 21,
            },
            "sand" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "Anteil Sand",
                "unit" : "%",
                "index": 22,
            },
            "ph" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "pH Wert (CaCl2)",
                "unit" : "pH",
                "index": 23,
            },
            "caco3" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "Anteil Kalzium Karbonat",
                "unit" : "%",
                "index": 24,
            },
            "humus" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "Anteil Humus",
                "unit" : "%",
                "index": 25,
            },
            "AWC" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "verfügbare Wassermenge je Meter Wurzeltiefe",
                "unit" : "mm/m",
                "index": 26,
            },
        }
    }
}
)

db.Schema.save(
{
    "className" : "de.atb_potsdam.agrohyd.agroobj.Schema",
    "objectType" : "soil",
    "version" : 3,
    "description" : "Soils",
    "rgbcolor" : [
        153,
        102,
        0,
    ],
    "iteratorType" : [
        {
            "className" : "de.atb_potsdam.agrohyd.agroobj.Schema$IteratorZ",
            "type" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "Depth",
                "unit" : "m",
            },
            "id": "z",
            "argName" : "z",
        },
    ],
    "iteratorCondition" : function(value, lib) {
        return {
            "start.value": {$lte: value},
            "end.value": {$gt: value},
        };
    },
    "iteratorCompare" : function(v1, v2, lib) {
        return  v1.z - v2.z;
    },
    "fixArgs" : {
        "typeMap" : {
            "name" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 0,
            },
            "Nutzung" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 1,
            },
            "FBF" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 2,
            },
            "FBFverbal" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 3,
            },
            "HSK" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 4,
            },
            "HSKa" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 5,
            },
            "Tiefe" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "unit" : "cm",
                "index": 6,
            },
            "M1" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "unit" : "cm",
                "index": 7,
            },
            "nFK" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "unit" : "vol %",
                "index": 8,
            },
            "nFKz" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "unit" : "vol %",
                "index": 9,
            },
            "nFK25" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "unit" : "vol %",
                "index": 10,
            },
            "nFKmin" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "unit" : "vol %",
                "index": 11,
            },
            "nFK75" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "unit" : "vol %",
                "index": 12,
            },
            "nFKmax" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "unit" : "vol %",
                "index": 13,
            },
            "nFKi" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "unit" : "vol %",
                "index": 14,
            },
            "nFKn" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "unit" : "vol %",
                "index": 15,
            },
            "V_nFK" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "unit" : "vol %",
                "index": 16,
            },
            "Vv_nFK" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 17,
            },
            "nFK_Bemerk" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 18,
            },
            "FK" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "unit" : "vol %",
                "index": 19,
            },
            "FKz" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "unit" : "vol %",
                "index": 20,
            },
            "FK25" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "unit" : "vol %",
                "index": 21,
            },
            "FKmin" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "unit" : "vol %",
                "index": 22,
            },
            "FK75" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "unit" : "vol %",
                "index": 23,
            },
            "FKmax" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "unit" : "vol %",
                "index": 24,
            },
            "FKi" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "unit" : "vol %",
                "index": 25,
            },
            "FKn" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "unit" : "vol %",
                "index": 26,
            },
            "V_FK" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "unit" : "vol %",
                "index": 27,
            },
            "Vv_FK" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 28,
            },
            "FK_Bemerk" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 29,
            },
            "OT1" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 30,
            },
            "OT" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 31,
            },
            "OT25" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 32,
            },
            "OT75" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 33,
            },
            "OTi" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 34,
            },
            "OTn" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 35,
            },
            "V_OT" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 36,
            },
            "Vv_OT" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 37,
            },
            "UT" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 38,
            },
            "UT25" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 39,
            },
            "UT75" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 40,
            },
            "UTi" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 41,
            },
            "UTn" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 42,
            },
            "V_UT" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 43,
            },
            "Vv_UT" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 44,
            },
            "M" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 45,
            },
            "M25" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 46,
            },
            "M75" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 47,
            },
            "Mi" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 48,
            },
            "Mn" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 49,
            },
            "V_M" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 50,
            },
            "Vv_M" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 51,
            },
            "Wassereinfluss" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeInteger",
                "index": 52,
            },
            "T1" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 53,
            },
            "T" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 54,
            },
            "T25" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 55,
            },
            "T75" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 56,
            },
            "Tmin" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 57,
            },
            "Tmax" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 58,
            },
            "Ti" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 59,
            },
            "Tn" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 60,
            },
            "V_T" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 61,
            },
            "Vv_T" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 62,
            },
            "T_Bemerk" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 63,
            },
            "U1" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 64,
            },
            "U" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 65,
            },
            "U25" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 66,
            },
            "U75" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 67,
            },
            "Umin" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 68,
            },
            "Umax" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 69,
            },
            "Ui" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 70,
            },
            "Un" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 71,
            },
            "V_U" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 72,
            },
            "Vv_U" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 73,
            },
            "U_Bemerk" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 74,
            },
            "S1" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 75,
            },
            "S" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 76,
            },
            "S25" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 77,
            },
            "S75" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 78,
            },
            "Smin" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 79,
            },
            "Smax" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 80,
            },
            "Si" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 81,
            },
            "Sn" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 82,
            },
            "V_S" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 83,
            },
            "Vv_S" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 84,
            },
            "S_Bemerk" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 85,
            },
            "Grobbo1" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 86,
            },
            "BOART" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 87,
            },
            "TRD" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 88,
            },
            "TRD25" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 89,
            },
            "TRD75" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 90,
            },
            "TRDmin" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 91,
            },
            "TRDmax" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 92,
            },
            "TRDi" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 93,
            },
            "TRDn" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 94,
            },
            "V_TRD" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 95,
            },
            "Vv_TRD" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 96,
            },
            "TRD_Bemerk" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 97,
            },
            "TRDk" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 98,
            },
            "pHCaCl2" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 99,
            },
            "pHCaCl2k" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 100,
            },
            "pHCaCl225" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 101,
            },
            "pHCaCl275" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 102,
            },
            "pHCaCl2min" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 103,
            },
            "pHCaCl2max" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 104,
            },
            "pHCaCl2i" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 105,
            },
            "pHCaCl2n" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 106,
            },
            "V_pHCaCl2" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 107,
            },
            "Vv_pHCaCl2" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 108,
            },
            "pHCaCl2_Bemerk" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 109,
            },
            "KAKeff" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 110,
            },
            "KAKeffk" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 111,
            },
            "KAKeff25" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 112,
            },
            "KAKeff75" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 113,
            },
            "KAKeffmin" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 114,
            },
            "KAKeffmax" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 115,
            },
            "KAKeffi" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 116,
            },
            "KAKeffn" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 117,
            },
            "V_KAKeff" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 118,
            },
            "Vv_KAKeff" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 119,
            },
            "KAKeff_Bemerk" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 120,
            },
            "KAKpot" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 121,
            },
            "KAKpotk" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 122,
            },
            "KAKpot25" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 123,
            },
            "KAKpot75" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 124,
            },
            "KAKpotmin" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 125,
            },
            "KAKpotmax" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 126,
            },
            "KAKpoti" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 127,
            },
            "KAKpotn" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 128,
            },
            "V_KAKpot" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 129,
            },
            "Vv_KAKpot" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 130,
            },
            "KAKpot_Bemerk" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 131,
            },
            "Humus" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 132,
            },
            "Humusk" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 133,
            },
            "Humus25" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 134,
            },
            "Humus75" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 135,
            },
            "Humusmin" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 136,
            },
            "Humusmax" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 137,
            },
            "Humusi" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 138,
            },
            "Humusn" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 139,
            },
            "Humusm" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 140,
            },
            "Humusz" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 141,
            },
            "Ct" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 142,
            },
            "Ctk" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 143,
            },
            "Ct25" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 144,
            },
            "Ct75" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 145,
            },
            "Ctmin" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 146,
            },
            "Ctmax" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 147,
            },
            "Cti" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 148,
            },
            "Ctn" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 149,
            },
            "V_Ct" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 150,
            },
            "Vv_Ct" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 151,
            },
            "Ct_Bemerk" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 152,
            },
            "Kf" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 153,
            },
            "Kfz" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 154,
            },
            "Kf25" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 155,
            },
            "Kf75" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 156,
            },
            "Kfmin" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 157,
            },
            "Kfmax" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 158,
            },
            "Kfi" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 159,
            },
            "Kfn" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 160,
            },
            "V_Kf" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 161,
            },
            "Vv_Kf" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 162,
            },
            "Kf_Bemerk" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 163,
            },
            "LK" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 164,
            },
            "LKz" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 165,
            },
            "LK25" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 166,
            },
            "LK75" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 167,
            },
            "LKmin" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 168,
            },
            "LKmax" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 169,
            },
            "LKi" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 170,
            },
            "LKn" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 171,
            },
            "V_LK" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 172,
            },
            "Vv_LK" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 173,
            },
            "LK_Bemerk" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 174,
            },
            "TW" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 175,
            },
            "Kalk" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 176,
            },
            "Kalk10" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 177,
            },
            "Kalk90" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 178,
            },
            "Kalkmin" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 179,
            },
            "Kalkmax" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 180,
            },
            "Kalki" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 181,
            },
            "Kalkn" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 182,
            },
            "Kalkk" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 183,
            },
            "Vv_Kalk" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 184,
            },
            "Kalk_Bemerk" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 185,
            },
            "Ld" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 186,
            },
            "Ld10" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 187,
            },
            "Ld90" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 188,
            },
            "Ldmin" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 189,
            },
            "Ldmax" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 190,
            },
            "Ldn" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "index": 191,
            },
            "Ldk" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 192,
            },
            "GEF" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 193,
            },
            "Qfc" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "Feldkapazitaet m³(Wasser)/m³(Boden)",
                "unit" : "none",
                "index": 194,
            },
            "Qwp" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "Welkepunkt m³(Wasser)/m³(Boden)",
                "unit" : "none",
                "index": 195,
            },
            "AWC" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "verfügbare Wassermenge je Meter Wurzeltiefe",
                "unit" : "mm/m",
                "index": 196,
            },
        }
    }
}
)

db.Schema.save(
{ 
    "className" : "de.atb_potsdam.agrohyd.agroobj.Schema",
    "objectType" : "livestock",
    "version" : 1,
    "description" : "Livestocks",
    "rgbcolor" : [
        255,
        153,
        51,
    ],
    "iteratorType" : [
        {
            "className" : "de.atb_potsdam.agrohyd.agroobj.Schema$IteratorDay",
            "type" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeInteger",
                "description": "Day",
                "unit" : "d",
            },
            "id" : "day",
            "argName" : "day",
        },
    ],
    "iteratorCondition" : function(value, lib) {
        return {
            "start.value": {$lte: value},
            "end.value": {$gte: value},
        };
    },
    "iteratorCompare" : function(v1, v2, lib) {
        return  v1.day - v2.day;
    },
    "fixArgs" : {
        "typeMap" : {
            "name" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 0,
            },
            "raceName" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "description": "race name",
                "index": 1,
            },
            "raceKey" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "description": "race key (ADR)",
                "index": 2,
            },
            "raceShort" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "description": "race short name (ADR)",
                "index": 3,
            },
            "lifeWeight" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "Lebendmasse",
                "unit" : "kg",
                "index": 4,
            },
            "fatteningEndWeight" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "Mastendmasse",
                "unit" : "kg",
                "index": 5,
            },
            "adg" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "average daily gain",
                "unit" : "kg",
                "index": 6,
            },
            "dmi" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "dry matter intake",
                "unit" : "kg",
                "index": 7,
            },
            "milkYield" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "taegliche Milchleistung",
                "unit" : "kg",
                "index": 8,
            },
            "milkYieldYear" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "jaehrliche Milchleistung",
                "unit" : "kg",
                "index": 9,
            },
            "milkFat" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "milkFat",
                "unit" : "%",
                "index": 10,
            },
            "protein" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "protein",
                "unit" : "%",
                "index": 11,
            },
            "replacementRate" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "replacement rate, percent per year",
                "unit" : "%",
                "index": 12,
            },
            "firstCalving" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeInteger",
                "description": "age of first calving in days",
                "unit" : "days",
                "index": 13,
            },
            "calvingInterval" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeInteger",
                "description": "calving interval in days",
                "unit" : "days",
                "index": 14,
            },
            "dryPeriod" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeInteger",
                "description": "dry period in days",
                "unit" : "days",
                "index": 15,
            },
            "p0" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "factor p0 for lactation curve calculation",
                "index": 16,
            },
            "p1" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "factor p1 for lactation curve calculation",
                "index": 17,
            },
            "p2" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "factor p2 for lactation curve calculation",
                "index": 18,
            },
            "p3" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "factor p3 for lactation curve calculation",
                "index": 19,
            },
            "p4" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "factor p4 for lactation curve calculation",
                "index": 20,
            },
            "pSum" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "precalculated integral for lactation curve scaling",
                "index": 21,
            },
            "fcm" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "fat correct milk",
                "unit" : "kg",
                "index": 22,
            },
            "ecm" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "energy correct milk",
                "unit" : "kg",
                "index": 23,
            },
        }
    }
}
)

db.Schema.save(
{ 
    "className" : "de.atb_potsdam.agrohyd.agroobj.Schema",
    "objectType" : "building",
    "version" : 1,
    "description" : "farm buildings",
    "rgbcolor" : [
        153,
        0,
        0,
    ],
    "iteratorType" : [
        {
            "className" : "de.atb_potsdam.agrohyd.agroobj.Schema$IteratorDate",
            "type" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDate",
                "description": "Date",
            },
            "id" : "date",
            "argName" : "date",
        },
    ],
    "iteratorCondition" : function(value, lib) {
        return {
            "start.value": {$lte: value},
            "end.value": {$gte: value},
        };
    },
    "iteratorCompare" : function(v1, v2, lib) {
        return  v1.date.getTime() - v2.date.getTime();
    },
    "fixArgs" : {
        "typeMap" : {
            "name" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 0,
            },
            "wellWater" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "well water",
                "unit" : "m³",
                "index": 1,
            },
            "publicWater" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "blue water",
                "unit" : "m³",
                "index": 2,
            },
        }
    }
}
)

db.Schema.save(
{ 
    "className" : "de.atb_potsdam.agrohyd.agroobj.Schema",
    "objectType" : "cropSequence",
    "version" : 1,
    "description" : "crop sequence",
    "rgbcolor" : [
        102,
        204,
        51,
    ],
    "iteratorType" : [
        {
            "className" : "de.atb_potsdam.agrohyd.agroobj.Schema$IteratorDate",
            "type" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDate",
                "description": "Date",
            },
            "id" : "date",
            "argName" : "date",
        },
    ],
    "iteratorCondition" : function(value, lib) {
        return {
            "start.value": {$lte: value},
            "end.value": {$gte: value},
        };
    },
    "iteratorCompare" : function(v1, v2, lib) {
        return  v1.date.getTime() - v2.date.getTime();
    },
    "fixArgs" : {
        "typeMap" : {
            "name" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 0,
            },
            "humidity" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "water content",
                "unit" : "%",
                "index": 1,
            },
            "gainFM" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "gain mass",
                "unit" : "kg/m²",
                "index": 2,
            },
            "gainTM" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "gain mass dry matter",
                "unit" : "kg/m²",
                "index": 3,
            },
            "usage" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 4,
            },
            "plant" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeAgroObj",
                "objectType": "plant",
                "version": 1,
                "description": "plant object",
                "unit" : "ref",
                "index": 5,
            },
        }
    }
}
)

db.Schema.save(
{ 
    "className" : "de.atb_potsdam.agrohyd.agroobj.Schema",
    "objectType" : "managementOption",
    "version" : 1,
    "description" : "management options like irrigation, tillage, fertilizing, antibiotika etc.",
    "rgbcolor" : [
        102,
        204,
        51,
    ],
    "iteratorType" : [
        {
            "className" : "de.atb_potsdam.agrohyd.agroobj.Schema$IteratorDate",
            "type" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDate",
                "description": "Date",
            },
            "id" : "date",
            "argName" : "date",
        },
    ],
    "iteratorCondition" : function(value, lib) {
        return {
            "start.value": {$lte: value},
            "end.value": {$gte: value},
        };
    },
    "iteratorCompare" : function(v1, v2, lib) {
        return  v1.date.getTime() - v2.date.getTime();
    },
    "fixArgs" : {
        "typeMap" : {
            "name" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 0,
            },
            "irrigation" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "irrigation",
                "unit" : "l/m²",
                "index": 1,
            },
            "irrigationFw" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "fraction of surfaced wetted by irrigation",
                "unit" : "none",
                "index": 2,
            },
            "fertilization" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "fertilization",
                "unit" : "g/m²",
                "index": 3
                ,
            },
        }
    }
}
)

db.Schema.save(
{
    "className" : "de.atb_potsdam.agrohyd.agroobj.Schema",
    "objectType" : "dietComponent",
    "version" : 1,
    "description" : "single component of a diet",
    "rgbcolor" : [
        255,
        153,
        51,
    ],
    "iteratorType" : [
        {
            "className" : "de.atb_potsdam.agrohyd.agroobj.Schema$IteratorM",
            "type" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "Masse",
                "unit" : "kg",
            },
            "id": "m",
            "argName" : "m",
        },
    ],
    "iteratorCondition" : function(value, lib) {
        return {
            "start.value": {$lte: value},
            "end.value": {$gt: value},
        };
    },
    "iteratorCompare" : function(v1, v2, lib) {
        return  v1.m - v2.m;
    },
    "fixArgs" : {
        "typeMap" : {
            "name" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 0,
            },
            "price" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "Preis",
                "unit" : "€/kg",
                "index": 1,
            },
            "TS" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "Trocksubstanz",
                "unit" : "kg",
                "index": 2,
            },
            "Rohprotein" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "Anteil Rohprotein",
                "unit" : "kg",
                "index": 3,
            },
            "nXP" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "nutzbares Rohprotein",
                "unit" : "kg",
                "index": 4,
            },
            "RNB" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "ruminale Stickstoffbilanz",
                "unit" : "kg",
                "index": 5,
            },
            "NEL" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "Nettoenergie Laktation",
                "unit" : "MJ",
                "index": 6,
            },
            "ME" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "metabolisierbare Energie",
                "unit" : "MJ",
                "index": 7,
            },
            "Rohfaser" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "Anteil Rohfaser",
                "unit" : "kg",
                "index": 8,
            },
            "ADF" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "saure Detergenzienfaser",
                "unit" : "kg",
                "index": 9,
            },
            "NDF" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "neutrale Detergenzienfaser",
                "unit" : "kg",
                "index": 10,
            },
            "NFC" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "nicht Faser Kohlenhydrate",
                "unit" : "kg",
                "index": 11,
            },
            "Ca" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "Kalzium",
                "unit" : "kg",
                "index": 12,
            },
            "P" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "Phosphor",
                "unit" : "kg",
                "index": 13,
            },
            "Mg" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "Magnesium",
                "unit" : "kg",
                "index": 14,
            },
            "Na" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "Natrium",
                "unit" : "kg",
                "index": 15,
            },
            "K" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "Kalium",
                "unit" : "kg",
                "index": 16,
            },
            "Zucker_unbestaendige_Staerke" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "Zucker plus unbestaendige Staerke",
                "unit" : "kg",
                "index": 17,
            },
            "Staerke_bestaendig" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "bestaendige Staerke",
                "unit" : "kg",
                "index": 18,
            },
            "Zucker" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "Zucker",
                "unit" : "kg",
                "index": 19,
            },
            "Staerke" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "Staerke",
                "unit" : "kg",
                "index": 20,
            },
            "Staerke_Bestaendigkeit" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "Bestaendigkeit Staerke",
                "unit" : "%",
                "index": 21,
            },
            "plant" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeAgroObj",
                "objectType": "plant",
                "version": 1,
                "description": "plant object",
                "unit" : "ref",
                "index": 22,
            },
            "livestock" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeAgroObj",
                "objectType": "livestock",
                "version": 1,
                "description": "livestock object",
                "unit" : "ref",
                "index": 23,
            },
        }
    }
}
)


db.Schema.save(
{ 
    "className" : "de.atb_potsdam.agrohyd.agroobj.Schema",
    "objectType" : "diet",
    "version" : 1,
    "description" : "diet, combination of components",
    "rgbcolor" : [
        255,
        153,
        51,
    ],
    "iteratorType" : [
        {
            "className" : "de.atb_potsdam.agrohyd.agroobj.Schema$IteratorI",
            "type" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeInteger",
                "description": "i",
                "unit" : "i",
            },
            "id" : "i",
            "argName" : "i",
        },
    ],
    "iteratorCondition" : function(value, lib) {
        return {
            "start.value": {$lte: value},
            "end.value": {$gte: value},
        };
    },
    "iteratorCompare" : function(v1, v2, lib) {
        return  v1.i - v2.i;
    },
    "fixArgs" : {
        "typeMap" : {
            "name" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 0,
            },
            "fodderComponent" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeAgroObj",
                "objectType": "dietComponent",
                "version": 1,
                "description": "dietComponent object",
                "unit" : "ref",
                "index": 1,
            },
            "fraction" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDouble",
                "description": "fraction of this component in diet",
                "index": 2,
            },
        }
    }
}
)


db.Schema.save(
{ 
    "className" : "de.atb_potsdam.agrohyd.agroobj.Schema",
    "objectType" : "dietGroup",
    "version" : 1,
    "description" : "group of date and possible day dependend diets",
    "rgbcolor" : [
        255,
        153,
        51,
    ],
    "iteratorType" : [
        {
            "className" : "de.atb_potsdam.agrohyd.agroobj.Schema$IteratorDate",
            "type" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeDate",
                "description": "Date",
            },
            "id" : "date",
            "argName" : "date",
        },
        {
            "className" : "de.atb_potsdam.agrohyd.agroobj.Schema$IteratorDay",
            "type" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeInteger",
                "description": "Day",
            },
            "id" : "day",
            "argName" : "day",
        },
    ],
    "iteratorCondition" : function(value, lib) {
        return {
            "start.value.date.value": {$lte: value.date},
            "end.value.date.value": {$gte: value.date},
            "start.value.day.value": {$lte: value.day},
            "end.value.day.value": {$gte: value.day},
        };
    },
    "iteratorCompare" : function(v1, v2, lib) {
        var dateDiff= v1.date.getTime() - v2.date.getTime();
        if (dateDiff == 0) {
            return v1.day - v2.day;
        }
        return dateDiff;
    },
    "iteratorToKey" : function(value, lib) {
        return lib.keyToString(value.date.value) + "_" + lib.keyToString(value.day.value);
    },
    "fixArgs" : {
        "typeMap" : {
            "name" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeString",
                "index": 0,
            },
            "ration" : {
                "className" : "de.atb_potsdam.agrohyd.type.TypeAgroObj",
                "objectType": "diet",
                "version": 1,
                "description": "diet object",
                "unit" : "ref",
                "index": 1,
            },
        }
    }
}
)
