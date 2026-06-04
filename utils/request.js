// 统一请求封装
export const BASE_URL = 'https://wa15.shangyundian.cn/api'
export const UPLOAD_BASE = 'https://wa15.shangyundian.cn/upload/'

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
	return new Promise((resolve, reject) => {
		uni.request({
			url: BASE_URL + url,
			method,
			data,
			header: {
				'Content-Type': 'application/json',
				...(options.header || {})
			},
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
		return request(url, 'POST', data, options)
	},
	put(url, data, options) {
		return request(url, 'PUT', data, options)
	},
	del(url, data, options) {
		return request(url, 'DELETE', data, options)
	}
}

// 业务接口
export const api = {
	// 获取过磅站列表
	getSites() {
		return http.get('/sites')
	},
	// 创建项目
	createProject(payload) {
		return http.post('/createProject', payload)
	},
	// 我的/附近项目列表
	myProjects() {
		return http.get('/myProject')
	},
	// 项目详情
	projectInfo(project_id) {
		return http.get('/projectInfo', { project_id })
	},
	// 提交发货单
	updateHairInfo(payload) {
		return http.post('/updateHairInfo', payload)
	},
	// 提交收货单
	updateReceiveInfo(payload) {
		return http.post('/updateReceiveInfo', payload)
	}
}

export default http
