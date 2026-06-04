/** 与 Apifox 文档对齐的请求体 / 响应解析 */

export function buildCreateProjectPayload(d) {
	if (!d) return {}
	const payload = {
		title: d.name,
		spec: JSON.stringify(d.specs || []),
		master_info: JSON.stringify(
			(d.owners || []).filter(o => o.phone).map(o => ({ name: o.name || '负责人', phone: o.phone }))
		),
		shipper_company: d.shipperCompany || '',
		receiver_company: d.receiverCompany || '',
		shipper_info: JSON.stringify(
			(d.shippers || []).filter(o => o.phone).map(o => ({ name: o.name || '发货人员', phone: o.phone }))
		),
		receiver_info: JSON.stringify(
			(d.receivers || []).filter(o => o.phone).map(o => ({ name: o.name || '收货人员', phone: o.phone }))
		),
		price: String(Number(d.driverFee ?? 0))
	}
	if (d.invoiceNeed) {
		payload.need_ticket = '1'
		payload.ticket_info = JSON.stringify({
			抬头: d.invoiceTitle || '',
			税号: d.invoiceNo || ''
		})
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
