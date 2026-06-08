/** 与 Apifox 文档对齐的请求体 / 响应解析 */

export function buildCreateProjectPayload(d) {
	if (!d) return {}
	const payload = {
		title: d.name,
		spec: d.specs || [],
		master_info: (d.owners || []).filter(o => o.phone).map(o => ({
			name: o.name || '负责人',
			phone: o.phone
		})),
		shipper_company: d.shipperCompany || '',
		receiver_company: d.receiverCompany || '',
		shipper_info: (d.shippers || []).filter(o => o.phone).map(o => ({
			name: o.name || '发货人员',
			phone: o.phone
		})),
		receiver_info: (d.receivers || []).filter(o => o.phone).map(o => ({
			name: o.name || '收货人员',
			phone: o.phone
		})),
		price: Number(d.driverFee ?? 0)
	}
	if (d.invoiceNeed) {
		payload.need_ticket = 1
		payload.ticket_info = {
			抬头: d.invoiceTitle || '',
			税号: d.invoiceNo || ''
		}
	}
	return payload
}

/** 详情 row 字段兼容 */
export function parseProjectRow(row) {
	if (!row) return null
	return {
		id: row.id,
		title: row.title || row.name || '',
		driverFee: Number(row.price ?? row.driver_fee ?? 0),
		shipperCompany: row.shipper_company || '',
		receiverCompany: row.receiver_company || '',
		isPaid: isProjectPaid(row)
	}
}

export function isProjectPaid(row) {
	if (!row) return false
	return row.is_paid === 1 || row.is_paid === true
		|| row.pay_status === 1 || row.pay_status === 'paid' || row.paid === 1
		|| row.status === 1 || row.status === 'paid'
}

export function sleep(ms) {
	return new Promise(r => setTimeout(r, ms))
}

/** 解析项目详情中的装/卸货块 */
export function pickWeightBlock(row, role) {
	if (!row) return null
	const block = role === 'ship' ? row.hair : row.receive
	if (!block) return null
	return {
		gross: block.gross ?? block['毛重'] ?? '',
		tare: block.tare ?? block['皮重'] ?? '',
		net: block.net ?? block['净重'] ?? '',
		number: block.number || '',
		weight_pic: block.weight_pic,
		addr_pic: block.addr_pic
	}
}

/** 是否已有磅单且待核对（无明确字段时：有净重且未标 is_check） */
export function isBlockPending(block) {
	if (!block) return false
	const hasData = block.number || block.net || block['净重']
	if (!hasData) return false
	if (block.is_check === 1 || block.is_check === '1') return false
	if (block.checked === 1 || block.checked === '1') return false
	if (block.verified === 1 || block.verified === '1') return false
	return true
}

export function parseMemberList(raw) {
	if (!raw) return []
	if (Array.isArray(raw)) return raw
	try { return JSON.parse(raw) } catch (e) { return [] }
}

export function parseJsonField(raw) {
	if (raw == null || raw === '') return null
	if (typeof raw === 'object') return raw
	try { return JSON.parse(raw) } catch (e) { return null }
}

/** 登录用户远端 uid（本地 id 形如 U7 → 7） */
export function currentRemoteUid(user) {
	if (!user) return null
	if (user.remoteUid != null) return Number(user.remoteUid)
	const m = String(user.id || '').match(/^U(\d+)$/)
	return m ? Number(m[1]) : null
}

/** 统一解析 myProject 列表项 */
export function normalizeMyProject(p) {
	if (!p) return null
	const masters = parseMemberList(p.master || p.master_info)
	const shippers = parseMemberList(p.shipper || p.shipper_info)
	const receivers = parseMemberList(p.receiver || p.receiver_info)
	return {
		id: p.id,
		remoteId: p.id,
		no: p.id,
		title: p.title || p.name || '',
		name: p.title || p.name || ('项目#' + p.id),
		role: p.role || '',
		roleLabel: p.role_label || '',
		uid: p.uid,
		payStatus: p.pay_status,
		shipperStatus: p.shipper_status,
		receiverStatus: p.receiver_status,
		resultNum: p.result_num,
		shipperScore: p.shipper_score,
		receiverScore: p.receiver_score,
		price: Number(p.price) || 0,
		driverFee: Number(p.driver_fee ?? p.price) || 0,
		shipperCompany: p.shipper_company || '',
		receiverCompany: p.receiver_company || '',
		masters,
		shippers,
		receivers,
		owners: masters.map(m => ({ name: m.name, phone: m.phone })),
		spec: parseJsonField(p.spec),
		allocate: parseJsonField(p.allocate),
		raw: p
	}
}

export function parseMyProjectList(res) {
	const rows = (res && res.list) || (Array.isArray(res) ? res : [])
	return rows.map(normalizeMyProject).filter(Boolean)
}

/** 是否项目负责人（发布人 / master 名单） */
export function isProjectOwner(project, user) {
	if (!project || !user) return false
	if (project.role === 'creator') return true
	const uid = currentRemoteUid(user)
	if (uid != null && project.uid === uid) return true
	const phone = user.phone
	return (project.masters || project.owners || []).some(m => m.phone === phone)
}

/** 当前用户在项目中的过磅角色：ship / recv */
function parseHistoryTimestamp(raw) {
	if (!raw) return Date.now()
	if (typeof raw === 'number') return raw
	const s = String(raw).trim()
	if (!s) return Date.now()
	const t = new Date(s.replace(/-/g, '/')).getTime()
	return Number.isFinite(t) ? t : Date.now()
}

export function formatHistoryTime(raw) {
	if (!raw) return '—'
	const d = new Date(parseHistoryTimestamp(raw))
	if (isNaN(d.getTime())) return String(raw)
	const pad = n => String(n).padStart(2, '0')
	return `${d.getMonth() + 1}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 导出/详情行 → 过磅历史记录 */
export function mapExportHistoryRow(b, i, driverFee = 0) {
	const sn = Number(b.ship_net ?? b.hair_net ?? b.snet ?? b.net ?? 0)
	const rn = Number(b.recv_net ?? b.receive_net ?? b.rnet ?? 0)
	const rawTime = b.created_at || b.updated_at || b.time || b.date || ''
	const fee = Number(b.fee ?? b.driver_fee ?? b.price ?? driverFee) || 0
	return {
		id: b.id || ('h' + i),
		plate: b.number || b.plate || '-',
		shipNet: sn,
		recvNet: rn,
		loss: +(sn - rn).toFixed(2),
		fee,
		time: parseHistoryTimestamp(rawTime || Date.now() - i * 60000),
		timeText: formatHistoryTime(rawTime)
	}
}

/** projectInfo 单行装/卸 → 一条历史 */
export function historyFromProjectInfo(row, driverFee = 0) {
	if (!row) return []
	const hair = row.hair
	const recv = row.receive
	const sn = hair ? Number(hair.net ?? hair['净重'] ?? 0) : 0
	const rn = recv ? Number(recv.net ?? recv['净重'] ?? 0) : 0
	const hasHair = !!(hair && (hair.number || sn))
	const hasRecv = !!(recv && (recv.number || rn))
	if (!hasHair && !hasRecv) return []
	const plate = (hair && hair.number) || (recv && recv.number) || '-'
	const rawTime = row.updated_at || row.created_at || ''
	return [{
		id: 'info',
		plate,
		shipNet: sn,
		recvNet: rn,
		loss: +(sn - rn).toFixed(2),
		fee: driverFee,
		time: parseHistoryTimestamp(rawTime),
		timeText: formatHistoryTime(rawTime)
	}]
}

/** 本地磅单 → 历史记录 */
export function historyFromLocalBills(bills, driverFee = 0) {
	return (bills || []).map(b => {
		const sn = Number(b.shipNet || b.net || 0)
		const rn = Number(b.recvNet || (b.recv && b.recv.net) || 0)
		return {
			id: b.id,
			plate: b.plate || '-',
			shipNet: sn,
			recvNet: rn,
			loss: +(sn - rn).toFixed(2),
			fee: Number(b.paid) || driverFee || 0,
			time: b.createdAt || Date.now(),
			timeText: formatHistoryTime(b.createdAt)
		}
	})
}

export function weighRolesInProject(project, user) {
	if (!project || !user) return []
	const roles = []
	const phone = user.phone
	const uid = currentRemoteUid(user)
	const shippers = project.shippers || []
	const receivers = project.receivers || []
	const inShip = shippers.some(m => m.phone === phone)
		|| (uid != null && shippers.some(m => m.shipper_uid === uid))
		|| project.role === 'shipper'
	const inRecv = receivers.some(m => m.phone === phone)
		|| (uid != null && receivers.some(m => m.receiver_uid === uid))
		|| project.role === 'receiver'
	if (inShip) roles.push('ship')
	if (inRecv) roles.push('recv')
	return roles
}

export function remoteProjectId(projectOrId) {
	if (!projectOrId) return ''
	const s = String(projectOrId)
	if (/^P\d+/.test(s)) return s.replace(/^P/, '')
	return s
}

/** 根据 goPay 返回调起微信小程序支付（timeStamp / nonceStr / package / signType / paySign） */
export function invokeWechatPay(data) {
	const raw = data && (data.pay || data.wxpay || data.payment || data)
	if (!raw || typeof raw !== 'object') {
		uni.showToast({ title: '支付参数为空', icon: 'none' })
		return Promise.reject(new Error('支付参数为空'))
	}
	const timeStamp = raw.timeStamp || raw.timestamp
	const nonceStr = raw.nonceStr || raw.nonce_str
	const pkg = raw.package || raw.pkg
	const signType = raw.signType || raw.sign_type || 'MD5'
	const paySign = raw.paySign || raw.pay_sign
	if (!timeStamp || !nonceStr || !pkg || !paySign) {
		uni.showToast({ title: '支付参数不完整', icon: 'none' })
		return Promise.reject(new Error('支付参数不完整'))
	}
	return new Promise((resolve, reject) => {
		uni.requestPayment({
			provider: 'wxpay',
			timeStamp: String(timeStamp),
			nonceStr,
			package: pkg,
			signType,
			paySign,
			success: () => resolve(true),
			fail: (err) => {
				uni.showToast({ title: (err && err.errMsg) || '支付已取消', icon: 'none' })
				reject(err)
			}
		})
	})
}
