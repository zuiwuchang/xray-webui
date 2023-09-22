const { make, Item } = require('./i18n/i18n');

const fs = require('fs');
// 定義 語言包 輸出檔案夾
const dir = `${__dirname}/src/assets/i18n`
// 定義 語言包
const langs = [
    'en',
    'zh-Hant',
    'zh-Hans',
]
// 定義 翻譯 id key
const keyname = `${__dirname}/src/app/i18n.ts`

// 定義 翻譯 id 
const i18n = require('./i18n/keys').keys;

function copyI18n(i18n, dst, src) {
    for (const o in i18n) {
        if (!Object.hasOwnProperty.call(i18n, o)) {
            continue
        } else if (o.startsWith("__")) {
            continue
        }
        const v = i18n[o]
        if (v === null || v === undefined || v instanceof Item) {
            const id = v?.id ?? o
            let val = null
            if (src) {
                val = src[id]
            }
            dst[id] = val ?? null
        } else if (typeof v === "object") {
            let id = v.__id ?? ''
            if (id == '') {
                id = o
            }
            let s
            if (src) {
                s = src[id]
                if (typeof s !== "object") {
                    s = null
                }
            }
            dst[id] = copyI18n(v, {}, s)
        }
    }
    return dst
}
// 創建語言包
for (const lang of langs) {
    let old
    const filename = `${dir}/${lang}.json`
    try {
        old = JSON.parse(fs.readFileSync(filename, {
            encoding: "utf-8"
        }))
    } catch (e) {
        if (e.code !== 'ENOENT') {
            throw e
        }
        // not found
    }
    fs.writeFileSync(filename, JSON.stringify(copyI18n(i18n, {}, old), "", "\t"), {
        flag: "w"
    })
}
function generateKey(strs, obj, prefix, tab) {
    for (const o in obj) {
        if (!Object.hasOwnProperty.call(obj, o)) {
            continue
        } else if (o.startsWith("__")) {
            continue
        }

        const v = obj[o]
        if (v === null || v === undefined || v instanceof Item) {
            let id = v?.id ?? o
            id = prefix == '' ? id : prefix + '.' + id
            const note = v?.note ?? ''
            if (note != '') {
                strs.push(`${tab}/**`)
                const vals = note.split("\n")
                for (const val of vals) {
                    strs.push(`${tab}* ${val}`)
                }
                strs.push(`${tab}*/`)
            }
            strs.push(`${tab}${o}: ${JSON.stringify(id)},`)
        } else if (typeof v === "object") {
            let id = v.__id ?? ''
            if (id == '') {
                id = o
            }
            strs.push(`${tab}${o}: {`)
            generateKey(strs, v, prefix == "" ? id : `${prefix}.${id}`, tab + "\t")
            strs.push(`${tab}},`)
        }
    }
}
function generateKeys() {
    const strs = []
    generateKey(strs, i18n, "", "\t")
    return "export const i18n = {\n" + strs.join("\n") + "\n}"
}
// 創建源碼 key
fs.writeFileSync(keyname, generateKeys(), {
    flag: "w"
})