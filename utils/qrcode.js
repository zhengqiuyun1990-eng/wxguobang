/**
 * 轻量 QR Code 生成 & 绘制到 uni-app canvas
 * 基于 QR Code Model 2 实现，支持数字/字母/ASCII
 */

// QR Code 核心编码
const QRCode = (function () {
	const PAD0 = 0xEC, PAD1 = 0x11

	function QRData(data) { this.data = data }
	QRData.prototype.getLength = function () { return this.data.length }
	QRData.prototype.write = function (buffer) {
		for (let i = 0; i < this.data.length; i++) buffer.put(this.data.charCodeAt(i), 8)
	}

	function QRBitBuffer() { this.buffer = []; this.length = 0 }
	QRBitBuffer.prototype.get = function (i) { return ((this.buffer[Math.floor(i / 8)] >>> (7 - i % 8)) & 1) === 1 }
	QRBitBuffer.prototype.put = function (num, len) { for (let i = 0; i < len; i++) this.putBit(((num >>> (len - i - 1)) & 1) === 1) }
	QRBitBuffer.prototype.getLengthInBits = function () { return this.length }
	QRBitBuffer.prototype.putBit = function (bit) {
		const bufI = Math.floor(this.length / 8)
		if (this.buffer.length <= bufI) this.buffer.push(0)
		if (bit) this.buffer[bufI] |= (0x80 >>> (this.length % 8))
		this.length++
	}

	const EXP_TABLE = new Array(256)
	const LOG_TABLE = new Array(256)
	;(function () {
		for (let i = 0; i < 8; i++) EXP_TABLE[i] = 1 << i
		for (let i = 8; i < 256; i++) EXP_TABLE[i] = EXP_TABLE[i - 4] ^ EXP_TABLE[i - 5] ^ EXP_TABLE[i - 6] ^ EXP_TABLE[i - 8]
		for (let i = 0; i < 255; i++) LOG_TABLE[EXP_TABLE[i]] = i
	})()

	function gexp(n) { while (n < 0) n += 255; while (n >= 256) n -= 255; return EXP_TABLE[n] }
	function glog(n) { if (n < 1) throw new Error('glog(' + n + ')'); return LOG_TABLE[n] }

	function QRPolynomial(num, shift) {
		let offset = 0
		while (offset < num.length && num[offset] === 0) offset++
		this.num = new Array(num.length - offset + shift)
		for (let i = 0; i < num.length - offset; i++) this.num[i] = num[i + offset]
	}
	QRPolynomial.prototype.get = function (i) { return this.num[i] }
	QRPolynomial.prototype.getLength = function () { return this.num.length }
	QRPolynomial.prototype.multiply = function (e) {
		const num = new Array(this.getLength() + e.getLength() - 1)
		for (let i = 0; i < this.getLength(); i++)
			for (let j = 0; j < e.getLength(); j++)
				num[i + j] ^= gexp(glog(this.get(i)) + glog(e.get(j)))
		return new QRPolynomial(num, 0)
	}
	QRPolynomial.prototype.mod = function (e) {
		if (this.getLength() - e.getLength() < 0) return this
		const ratio = glog(this.get(0)) - glog(e.get(0))
		const num = new Array(this.getLength())
		for (let i = 0; i < this.getLength(); i++) num[i] = this.get(i)
		for (let i = 0; i < e.getLength(); i++) num[i] ^= gexp(glog(e.get(i)) + ratio)
		return new QRPolynomial(num, 0).mod(e)
	}

	function getErrorCorrectPolynomial(ecLen) {
		let a = new QRPolynomial([1], 0)
		for (let i = 0; i < ecLen; i++) a = a.multiply(new QRPolynomial([1, gexp(i)], 0))
		return a
	}

	// RS块定义 (version 1~10, EC level L)
	const RS_BLOCK_TABLE = [
		[1, 26, 19], [1, 44, 34], [1, 70, 55], [1, 100, 80], [1, 134, 108],
		[2, 86, 68], [2, 98, 78], [2, 121, 97], [2, 146, 116], [2, 174, 136],
		[4, 101, 81], [4, 116, 92], [4, 133, 107], [4, 145, 115], [4, 109, 87],
		[4, 122, 98], [4, 135, 107], [3, 150, 120, 1, 151, 121], [3, 141, 113, 1, 142, 114], [3, 135, 107, 1, 136, 108]
	]

	function getRSBlocks(ver) {
		const rs = RS_BLOCK_TABLE[ver - 1]
		if (!rs) throw new Error('bad version: ' + ver)
		const list = []
		for (let i = 0; i < rs.length; i += 3) {
			const count = rs[i], total = rs[i + 1], dataCount = rs[i + 2]
			for (let j = 0; j < count; j++) list.push({ totalCount: total, dataCount })
		}
		return list
	}

	function getBCHTypeInfo(data) {
		let d = data << 10
		while (getBCHDigit(d) - getBCHDigit(1335) >= 0) d ^= (1335 << (getBCHDigit(d) - getBCHDigit(1335)))
		return ((data << 10) | d) ^ 21522
	}
	function getBCHTypeNumber(data) {
		let d = data << 12
		while (getBCHDigit(d) - getBCHDigit(7973) >= 0) d ^= (7973 << (getBCHDigit(d) - getBCHDigit(7973)))
		return (data << 12) | d
	}
	function getBCHDigit(data) { let digit = 0; while (data !== 0) { digit++; data >>>= 1 } return digit }

	const PATTERN_POSITION_TABLE = [
		[], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34],
		[6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50],
		[6, 30, 54], [6, 32, 58], [6, 34, 62], [6, 26, 46, 66],
		[6, 26, 48, 70], [6, 26, 50, 74], [6, 30, 54, 78],
		[6, 30, 56, 82], [6, 30, 58, 86], [6, 34, 62, 90]
	]

	function getPatternPosition(ver) { return PATTERN_POSITION_TABLE[ver - 1] }

	const MASK_FNS = [
		(i, j) => (i + j) % 2 === 0,
		(i, j) => i % 2 === 0,
		(i, j) => j % 3 === 0,
		(i, j) => (i + j) % 3 === 0,
		(i, j) => (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0,
		(i, j) => (i * j) % 2 + (i * j) % 3 === 0,
		(i, j) => ((i * j) % 2 + (i * j) % 3) % 2 === 0,
		(i, j) => ((i * j) % 3 + (i + j) % 2) % 2 === 0
	]

	function QRCodeModel(data, ecLevel) {
		this.ecLevel = ecLevel || 0
		this.data = data
		this.moduleCount = 0
		this.modules = null
		this.version = 0
		this.make()
	}

	QRCodeModel.prototype.make = function () {
		this.version = this.getBestVersion()
		this.moduleCount = this.version * 4 + 17
		this.modules = new Array(this.moduleCount)
		for (let r = 0; r < this.moduleCount; r++) {
			this.modules[r] = new Array(this.moduleCount)
			for (let c = 0; c < this.moduleCount; c++) this.modules[r][c] = null
		}
		this.setupPositionProbePattern(0, 0)
		this.setupPositionProbePattern(this.moduleCount - 7, 0)
		this.setupPositionProbePattern(0, this.moduleCount - 7)
		this.setupPositionAdjustPattern()
		this.setupTimingPattern()
		this.setupTypeInfo(false, 0)
		if (this.version >= 7) this.setupTypeNumber(false)

		const data = this.createData()
		let minLost = -1, bestPattern = 0
		for (let p = 0; p < 8; p++) {
			this.mapData(data, p)
			const lost = this.getLostPoint()
			if (minLost === -1 || lost < minLost) { minLost = lost; bestPattern = p }
		}
		// final render
		this.modules = new Array(this.moduleCount)
		for (let r = 0; r < this.moduleCount; r++) {
			this.modules[r] = new Array(this.moduleCount)
			for (let c = 0; c < this.moduleCount; c++) this.modules[r][c] = null
		}
		this.setupPositionProbePattern(0, 0)
		this.setupPositionProbePattern(this.moduleCount - 7, 0)
		this.setupPositionProbePattern(0, this.moduleCount - 7)
		this.setupPositionAdjustPattern()
		this.setupTimingPattern()
		this.setupTypeInfo(false, bestPattern)
		if (this.version >= 7) this.setupTypeNumber(false)
		this.mapData(data, bestPattern)
	}

	QRCodeModel.prototype.getBestVersion = function () {
		for (let v = 1; v <= 20; v++) {
			const rsBlocks = getRSBlocks(v)
			let totalData = 0
			rsBlocks.forEach(b => totalData += b.dataCount)
			const totalBits = totalData * 8
			const neededBits = 4 + (v < 10 ? 8 : 16) + this.data.length * 8
			if (neededBits <= totalBits) return v
		}
		return 20
	}

	QRCodeModel.prototype.setupPositionProbePattern = function (row, col) {
		for (let r = -1; r <= 7; r++) {
			if (row + r <= -1 || this.moduleCount <= row + r) continue
			for (let c = -1; c <= 7; c++) {
				if (col + c <= -1 || this.moduleCount <= col + c) continue
				this.modules[row + r][col + c] =
					(0 <= r && r <= 6 && (c === 0 || c === 6)) ||
					(0 <= c && c <= 6 && (r === 0 || r === 6)) ||
					(2 <= r && r <= 4 && 2 <= c && c <= 4)
			}
		}
	}

	QRCodeModel.prototype.setupPositionAdjustPattern = function () {
		const pos = getPatternPosition(this.version)
		for (let i = 0; i < pos.length; i++) {
			for (let j = 0; j < pos.length; j++) {
				const row = pos[i], col = pos[j]
				if (this.modules[row][col] !== null) continue
				for (let r = -2; r <= 2; r++) {
					for (let c = -2; c <= 2; c++) {
						this.modules[row + r][col + c] =
							r === -2 || r === 2 || c === -2 || c === 2 || (r === 0 && c === 0)
					}
				}
			}
		}
	}

	QRCodeModel.prototype.setupTimingPattern = function () {
		for (let r = 8; r < this.moduleCount - 8; r++) {
			if (this.modules[r][6] !== null) continue
			this.modules[r][6] = (r % 2 === 0)
		}
		for (let c = 8; c < this.moduleCount - 8; c++) {
			if (this.modules[6][c] !== null) continue
			this.modules[6][c] = (c % 2 === 0)
		}
	}

	QRCodeModel.prototype.setupTypeInfo = function (test, maskPattern) {
		const data = (this.ecLevel << 3) | maskPattern
		const bits = getBCHTypeInfo(data)
		for (let i = 0; i < 15; i++) {
			const mod = (!test && ((bits >> i) & 1) === 1)
			if (i < 6) this.modules[i][8] = mod
			else if (i < 8) this.modules[i + 1][8] = mod
			else this.modules[this.moduleCount - 15 + i][8] = mod
		}
		for (let i = 0; i < 15; i++) {
			const mod = (!test && ((bits >> i) & 1) === 1)
			if (i < 8) this.modules[8][this.moduleCount - i - 1] = mod
			else if (i < 9) this.modules[8][15 - i - 1 + 1] = mod
			else this.modules[8][15 - i - 1] = mod
		}
		this.modules[this.moduleCount - 8][8] = !test
	}

	QRCodeModel.prototype.setupTypeNumber = function (test) {
		const bits = getBCHTypeNumber(this.version)
		for (let i = 0; i < 18; i++) {
			const mod = (!test && ((bits >> i) & 1) === 1)
			this.modules[Math.floor(i / 3)][i % 3 + this.moduleCount - 8 - 3] = mod
		}
		for (let i = 0; i < 18; i++) {
			const mod = (!test && ((bits >> i) & 1) === 1)
			this.modules[i % 3 + this.moduleCount - 8 - 3][Math.floor(i / 3)] = mod
		}
	}

	QRCodeModel.prototype.createData = function () {
		const rsBlocks = getRSBlocks(this.version)
		const buffer = new QRBitBuffer()
		buffer.put(4, 4) // mode byte
		buffer.put(this.data.length, this.version < 10 ? 8 : 16)
		const qd = new QRData(this.data)
		qd.write(buffer)
		let totalDataCount = 0
		rsBlocks.forEach(b => totalDataCount += b.dataCount)
		if (buffer.getLengthInBits() > totalDataCount * 8) throw new Error('code length overflow')
		if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) buffer.put(0, 4)
		while (buffer.getLengthInBits() % 8 !== 0) buffer.putBit(false)
		while (true) {
			if (buffer.getLengthInBits() >= totalDataCount * 8) break
			buffer.put(PAD0, 8)
			if (buffer.getLengthInBits() >= totalDataCount * 8) break
			buffer.put(PAD1, 8)
		}
		return this.createBytes(buffer, rsBlocks)
	}

	QRCodeModel.prototype.createBytes = function (buffer, rsBlocks) {
		let offset = 0, maxDcCount = 0, maxEcCount = 0
		const dcdata = [], ecdata = []
		for (let r = 0; r < rsBlocks.length; r++) {
			const dcCount = rsBlocks[r].dataCount
			const ecCount = rsBlocks[r].totalCount - dcCount
			maxDcCount = Math.max(maxDcCount, dcCount)
			maxEcCount = Math.max(maxEcCount, ecCount)
			dcdata[r] = new Array(dcCount)
			for (let i = 0; i < dcCount; i++) dcdata[r][i] = 0xff & buffer.buffer[i + offset]
			offset += dcCount
			const rsPoly = getErrorCorrectPolynomial(ecCount)
			const rawPoly = new QRPolynomial(dcdata[r], rsPoly.getLength() - 1)
			const modPoly = rawPoly.mod(rsPoly)
			ecdata[r] = new Array(rsPoly.getLength() - 1)
			for (let i = 0; i < ecdata[r].length; i++) {
				const modIndex = i + modPoly.getLength() - ecdata[r].length
				ecdata[r][i] = (modIndex >= 0) ? modPoly.get(modIndex) : 0
			}
		}
		let totalCodeCount = 0
		rsBlocks.forEach(b => totalCodeCount += b.totalCount)
		const data = new Array(totalCodeCount)
		let index = 0
		for (let i = 0; i < maxDcCount; i++)
			for (let r = 0; r < rsBlocks.length; r++)
				if (i < dcdata[r].length) data[index++] = dcdata[r][i]
		for (let i = 0; i < maxEcCount; i++)
			for (let r = 0; r < rsBlocks.length; r++)
				if (i < ecdata[r].length) data[index++] = ecdata[r][i]
		return data
	}

	QRCodeModel.prototype.mapData = function (data, maskPattern) {
		let inc = -1, row = this.moduleCount - 1, bitIndex = 7, byteIndex = 0
		const maskFn = MASK_FNS[maskPattern]
		for (let col = this.moduleCount - 1; col > 0; col -= 2) {
			if (col === 6) col--
			while (true) {
				for (let c = 0; c < 2; c++) {
					if (this.modules[row][col - c] === null) {
						let dark = false
						if (byteIndex < data.length) dark = (((data[byteIndex] >>> bitIndex) & 1) === 1)
						if (maskFn(row, col - c)) dark = !dark
						this.modules[row][col - c] = dark
						bitIndex--
						if (bitIndex === -1) { byteIndex++; bitIndex = 7 }
					}
				}
				row += inc
				if (row < 0 || this.moduleCount <= row) { row -= inc; inc = -inc; break }
			}
		}
	}

	QRCodeModel.prototype.getLostPoint = function () {
		let lost = 0
		// simplified penalty
		for (let r = 0; r < this.moduleCount; r++) {
			for (let c = 0; c < this.moduleCount; c++) {
				let count = 0
				for (let dr = -1; dr <= 1; dr++) {
					for (let dc = -1; dc <= 1; dc++) {
						const rr = r + dr, cc = c + dc
						if (rr >= 0 && rr < this.moduleCount && cc >= 0 && cc < this.moduleCount) {
							if (this.modules[rr][cc] === this.modules[r][c]) count++
						}
					}
				}
				if (count >= 5) lost += (3 + count - 5)
			}
		}
		return lost
	}

	return { create: (data) => new QRCodeModel(data, 1) }
})()

/**
 * 在 uni-app canvas 上绘制二维码
 * @param {Object} ctx - 组件实例 (this)
 * @param {String} canvasId - canvas-id
 * @param {String} text - 二维码内容
 * @param {Number} size - canvas 逻辑尺寸 (px)
 */
export function drawQr(ctx, canvasId, text, size) {
	const qr = QRCode.create(text)
	const moduleCount = qr.moduleCount
	const cellSize = size / moduleCount
	const context = uni.createCanvasContext(canvasId, ctx)

	context.setFillStyle('#ffffff')
	context.fillRect(0, 0, size, size)
	context.setFillStyle('#000000')

	for (let row = 0; row < moduleCount; row++) {
		for (let col = 0; col < moduleCount; col++) {
			if (qr.modules[row][col]) {
				context.fillRect(col * cellSize, row * cellSize, cellSize, cellSize)
			}
		}
	}
	context.draw()
}
