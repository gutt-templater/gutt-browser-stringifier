import Component from '../../../libs/component'
import { authorize } from '../../../entities/auth/actions'
import store from '../../../store'

export default class AuthForm extends Component {
	events = {
		'input: [name="email"]': this.setEmail,
		'input: [name="password"]': this.setPassword,
		'submit: #auth-form': this.formSubmit
	}

	setEmail(event) {
		store.auth.updateField('email', event.target.value)
	}

	setPassword(event) {
		store.auth.updateField('password', event.target.value)
	}

	async formSubmit(event) {
		event.preventDefault()

		const { email, password } = store.getState().auth

		try {
			await authorize(email, password)
			window.location.reload()
		} catch (error) {
			store.auth.setError('Не подходит')
		}
	}
}
