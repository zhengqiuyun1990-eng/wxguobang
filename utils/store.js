// 简易本地数据库（uni.storage 同步）
const KEYS = {
	USER: 'gb_user',           // 当前登录用户
	USERS: 'gb_users',         // 所有注册用户
	PROJECTS: 'gb_projects',   // 项目
	BILLS: 'gb_bills',         // 磅单
	APPS: 'gb_applications',   // 加入项目申请
	SEQ: 'gb_seq'              // 编号自增 起始 80000
}

function get(key, def) {
	try {
		const v = uni.getStorageSync(key)
		return v === '' || v === null || v === undefined ? def : v
	} catch (e) { return def }
}
function set(key, val) { uni.setStorageSync(key, val) }

export const db = {
	// ----- 用户 -----
	currentUser() { return get(KEYS.USER, null) },
	setCurrentUser(u) { set(KEYS.USER, u) },
	logout() { uni.removeStorageSync(KEYS.USER) },
	isLogged() { return !!get(KEYS.USER, null) },

	allUsers() { return get(KEYS.USERS, []) },
	upsertUser(u) {
		const users = this.allUsers()
		const i = users.findIndex(x => x.phone === u.phone)
		if (i >= 0) users[i] = { ...users[i], ...u }
		else users.push(u)
		set(KEYS.USERS, users)
		return u
	},
	loginByPhone(phone) {
		let users = this.allUsers()
		let u = users.find(x => x.phone === phone)
		if (!u) {
			u = {
				id: 'U' + Date.now(),
				phone,
				nickname: '用户' + phone.slice(-4),
				plate: '',         // 司机车牌
				score: 2000,       // 过磅人初始2星=2000分
				totalPiece: 0,     // 累计计件 元
				createdAt: Date.now()
			}
			users.push(u)
			set(KEYS.USERS, users)
		}
		this.setCurrentUser(u)
		return u
	},
	updateUser(patch) {
		const u = this.currentUser()
		if (!u) return null
		const next = { ...u, ...patch }
		this.setCurrentUser(next)
		this.upsertUser(next)
		return next
	},

	// ----- 项目 -----
	nextProjectNo() {
		let n = get(KEYS.SEQ, 80000)
		n += 1
		set(KEYS.SEQ, n)
		return '00' + n // 0080001 起
	},
	allProjects() { return get(KEYS.PROJECTS, []) },
	saveProjects(list) { set(KEYS.PROJECTS, list) },
	getProject(id) { return this.allProjects().find(p => p.id === id) },
	createProject(p) {
		const list = this.allProjects()
		list.push(p)
		set(KEYS.PROJECTS, list)
	},
	updateProject(id, patch) {
		const list = this.allProjects()
		const i = list.findIndex(p => p.id === id)
		if (i >= 0) {
			list[i] = { ...list[i], ...patch }
			set(KEYS.PROJECTS, list)
			return list[i]
		}
		return null
	},

	// ----- 磅单 -----
	allBills() { return get(KEYS.BILLS, []) },
	saveBills(list) { set(KEYS.BILLS, list) },
	getBill(id) { return this.allBills().find(b => b.id === id) },
	addBill(b) {
		const list = this.allBills()
		list.push(b)
		set(KEYS.BILLS, list)
	},
	updateBill(id, patch) {
		const list = this.allBills()
		const i = list.findIndex(b => b.id === id)
		if (i >= 0) {
			list[i] = { ...list[i], ...patch }
			set(KEYS.BILLS, list)
			return list[i]
		}
		return null
	},
	billsOfProject(pid) { return this.allBills().filter(b => b.projectId === pid) },

	// ----- 申请 -----
	allApps() { return get(KEYS.APPS, []) },
	addApp(a) {
		const list = this.allApps()
		list.push(a)
		set(KEYS.APPS, list)
	},
	updateApp(id, patch) {
		const list = this.allApps()
		const i = list.findIndex(a => a.id === id)
		if (i >= 0) {
			list[i] = { ...list[i], ...patch }
			set(KEYS.APPS, list)
			return list[i]
		}
	},
	appsForOwner(uid) {
		// 我创建的项目下的申请
		const myProjects = this.allProjects().filter(p => p.ownerId === uid).map(p => p.id)
		return this.allApps().filter(a => myProjects.includes(a.projectId))
	}
}

// 星级 -> 单价
export function rateByScore(score) {
	const star = Math.max(1, Math.min(5, Math.floor(score / 1000 * 2) / 2))
	const map = { 1: 0.8, 1.5: 0.9, 2: 1.0, 2.5: 1.1, 3: 1.2, 3.5: 1.3, 4: 1.5, 4.5: 1.6, 5: 1.8 }
	return { star, rate: map[star] || 1.0 }
}

// 守卫：未登录跳到登录页
export function requireLogin() {
	if (!db.isLogged()) {
		uni.navigateTo({ url: '/pages/auth/login' })
		return false
	}
	return true
}

// 项目创建过程的临时草稿（跨页面）
export const draft = {
	project: null,
	reset() { this.project = { name: '', shipperCompany: '', receiverCompany: '', driverFee: 10, shippers: [], receivers: [], owners: [], specs: [], invoiceNeed: false, allocate: { ship: 40, recv: 40, owner: 20 } } }
}

// 通用：种入演示数据
export function seedDemo() {
	if (db.allProjects().length > 0) return
	// 不强制种入，保持简洁；用户可自行创建
}
