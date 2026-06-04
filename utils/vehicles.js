const VEHICLE_KEY = 'account_vehicles'
const MAX_VEHICLES = 100

export function getVehicles() {
	try { return JSON.parse(uni.getStorageSync(VEHICLE_KEY) || '[]') } catch (e) { return [] }
}

export function saveVehicles(list) {
	uni.setStorageSync(VEHICLE_KEY, JSON.stringify(list.slice(0, MAX_VEHICLES)))
}

export function addVehicle(plate) {
	const value = (plate || '').trim().toUpperCase()
	if (!value) return { ok: false, msg: '请输入车牌号' }
	const list = getVehicles()
	if (list.includes(value)) return { ok: true, list, plate: value }
	if (list.length >= MAX_VEHICLES) return { ok: false, msg: '最多绑定100台车' }
	list.push(value)
	saveVehicles(list)
	return { ok: true, list, plate: value }
}

export function removeVehicle(plate) {
	const list = getVehicles().filter(p => p !== plate)
	saveVehicles(list)
	return list
}

export { MAX_VEHICLES }
