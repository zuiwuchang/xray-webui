package log

// 日誌設定
type Options struct {
	// 日誌檔案名，如果爲空白則不寫入日誌檔案
	Filename string
	// 單個日誌檔案最大尺寸(單位:MB)
	MaxSize int
	// 日誌檔案最多保存多少天
	MaxDays int
	// 最大保存多少個日誌備份
	MaxBackups int
	// 如果爲 true 則在創建備份日誌時使用 gzip 進行壓縮
	Compress bool

	// 如果爲 true 輸入代碼所在位置
	Source bool

	// 日誌等級，默認爲 info
	// * debug
	// * info
	// * warn
	//  * error
	Level string
}
