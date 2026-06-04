// 统一请求封装（对齐 Apifox：form + Header token）
import { isProjectPaid, sleep } from '@/utils/api-util.js'

const DEFAULT_API = 'https://wa15.shangyundian.cn/api'
const DEFAULT_UPLOAD = 'https://wa15.shangyundian.cn/upload/'

function trimSlash(path) {
	return String(path || '').replace(/\/+$/, '')
}

export const BASE_URL = trimSlash(import.meta.env.VITE_API_BASE || DEFAULT_API)
export const UPLOAD_BASE = import.meta.env.VITE_UPLOAD_BASE || DEFAULT_UPLOAD
const SITE_CONFIG_KEY = 'gb_site_config'

export function getToken() {
	try {
		const u = uni.getStorageSync('gb_user')
		return (u && u.token) ? u.token : ''
	} catch (e) {
		return ''
	}
}

function authHeader(extra = {}) {
	const h = { ...extra }
	const token = getToken()
	if (token) h.token = token
	return h
}

function toFormBody(data) {
	return Object.keys(data || {})
		.filter(k => data[k] !== undefined && data[k] !== null)
		.map(k => encodeURIComponent(k) + '=' + encodeURIComponent(String(data[k])))
		.join('&')
}

// 拼接图片完整地址
export function imgUrl(path) {
	if (!path) return ''
	if (/^https?:\/\//.test(path)) return path
	return UPLOAD_BASE + String(path).replace(/^\/+/, '')
}

// 上传文件
export function uploadFile(filePath) {
	return new Promise((resolve, reject) => {
		uni.uploadFile({
			url: BASE_URL + '/upload',
			filePath,
			name: 'thumb',
			header: authHeader(),
			success: (res) => {
				try {
					const body = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
					if (body && (body.code === 0 || body.code === 200 || body.code === undefined)) {
						resolve(body.data && body.data.path)
					} else {
						uni.showToast({ title: (body && body.msg) || '上传失败', icon: 'none' })
						reject(body)
					}
				} catch (e) { reject(e) }
			},
			fail: (err) => {
				uni.showToast({ title: err.errMsg || '上传失败', icon: 'none' })
				reject(err)
			}
		})
	})
}

function request(url, method = 'GET', data = {}, options = {}) {
	const isForm = options.form === true
	const isLogin = url === '/login'
	return new Promise((resolve, reject) => {
		uni.request({
			url: BASE_URL + url,
			method,
			data: isForm ? toFormBody(data) : data,
			header: authHeader({
				'Content-Type': isForm ? 'application/x-www-form-urlencoded' : 'application/json',
				...(options.header || {})
			}),
			timeout: options.timeout || 15000,
			success: (res) => {
				const body = res.data || {}
				if (res.statusCode >= 200 && res.statusCode < 300) {
					if (body.code === 0 || body.code === 200 || body.code === undefined) {
						resolve(body.data !== undefined ? body.data : body)
					} else {
						uni.showToast({ title: body.msg || '请求失败', icon: 'none' })
						reject(body)
					}
				} else {
					uni.showToast({ title: '网络异常 ' + res.statusCode, icon: 'none' })
					reject(res)
				}
			},
			fail: (err) => {
				uni.showToast({ title: err.errMsg || '请求失败', icon: 'none' })
				reject(err)
			}
		})
	})
}

export const http = {
	get(url, params, options) {
		return request(url, 'GET', params, options)
	},
	post(url, data, options) {
		return request(url, 'POST', data, { ...options, form: options && options.form })
	},
	postForm(url, data, options) {
		return request(url, 'POST', data, { ...options, form: true })
	},
	put(url, data, options) {
		return request(url, 'PUT', data, options)
	},
	del(url, data, options) {
		return request(url, 'DELETE', data, options)
	}
}

// 业务接口（Apifox 7 项 + 代码中已有扩展）
export const api = {
	login(phone) {
		return http.postForm('/login', { phone }, { header: {} })
	},
	siteConfig() {
		return http.get('/siteConfig')
	},
	goPay(order_no) {
		return http.get('/goPay', { order_no })
	},
	createProject(payload) {
		return http.postForm('/createProject', payload)
	},
	allocateProject(order_id, allocate) {
		return http.postForm('/allocateProject', {
			order_id: String(order_id),
			allocate: typeof allocate === 'string' ? allocate : JSON.stringify(allocate)
		})
	},
	projectInfo(project_id) {
		return http.get('/projectInfo', { project_id })
	},
	getSites() {
		return http.get('/sites')
	},
	myProjects() {
		return http.get('/myProject')
	},
	updateHairInfo(payload) {
		return http.postForm('/updateHairInfo', payload)
	},
	updateReceiveInfo(payload) {
		return http.postForm('/updateReceiveInfo', payload)
	}
}

/** 轮询项目详情直至已支付（创建项目 → 拉起支付 之后） */
export async function pollProjectPaid(projectId, maxTry = 30, intervalMs = 2000) {
	for (let i = 0; i < maxTry; i++) {
		const res = await api.projectInfo(projectId)
		const row = res && (res.row || res)
		if (isProjectPaid(row)) return row
		await sleep(intervalMs)
	}
	throw new Error('支付状态确认超时，请稍后在「我的项目」查看')
}

export function saveSiteConfig(data) {
	try {
		uni.setStorageSync(SITE_CONFIG_KEY, data || {})
	} catch (e) {}
}

export function loadSiteConfig() {
	try {
		return uni.getStorageSync(SITE_CONFIG_KEY) || null
	} catch (e) {
		return null
	}
}

export default http
