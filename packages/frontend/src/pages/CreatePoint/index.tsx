import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { FiArrowLeft } from 'react-icons/fi';
import { Map, TileLayer, Marker } from 'react-leaflet';
import { Link, useHistory } from 'react-router-dom';

import axios from 'axios';
import { LeafletMouseEvent } from 'leaflet';

import './styles.css';

import logo from '../../assets/logo.svg';
import Dropzone from '../../components/Dropzone';
import SuccessMessage from '../../components/SuccessMessage';
import api from '../../services/api';

interface Item {
	id: number;
	title: string;
	image_url: string;
}

interface IBGEUFResponse {
	sigla: string;
}

interface IBGECityResponse {
	nome: string;
}

const CreatePoint = () => {
	const [items, setItems] = useState<Item[]>([]);
	const [ufs, setUfs] = useState<string[]>([]);
	const [citys, setCitys] = useState<string[]>([]);

	const [initialPosition, setInitialPosition] = useState<[number, number]>([0, 0]);

	const [selectedUF, setSelectedUF] = useState('0');
	const [selectedCity, setSelectedCity] = useState('0');
	const [selectedPosition, setSelectedPosition] = useState<[number, number]>([0, 0]);
	const [selectedItems, setSelectedItems] = useState<number[]>([]);

	const [successMessageVisibility, setSuccessMessageVisibility] = useState(false);

	const [selectedFile, setSelectedFile] = useState<File>();

	const [formData, setFormData] = useState({
		name: '',
		email: '',
		whatsapp: '',
	});

	const history = useHistory();

	useEffect(() => {
		api.get('items').then((response) => {
			setItems(response.data);
		});
	}, []);

	useEffect(() => {
		axios.get<IBGEUFResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome').then((response) => {
			const ufInitials = response.data.map((uf) => uf.sigla);

			setUfs(ufInitials);
		});
	}, []);

	useEffect(() => {
		if (selectedUF !== '0') {
			axios.get<IBGECityResponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUF}/municipios?orderBy=nome`)
				.then((response) => {
					const cityNames = response.data.map((uf) => uf.nome);

					setCitys(cityNames);
				});
		}
	}, [selectedUF]);

	useEffect(() => {
		navigator.geolocation.getCurrentPosition((position) => {
			const { latitude, longitude } = position.coords;
			setInitialPosition([latitude, longitude]);
		});
	}, []);

	function handleSelectUF(event: ChangeEvent<HTMLSelectElement>) {
		const uf = event.target.value;
		setSelectedUF(uf);
	}

	function handleSelectCity(event: ChangeEvent<HTMLSelectElement>) {
		const city = event.target.value;
		setSelectedCity(city);
	}

	function handleMapClick(event: LeafletMouseEvent) {
		setSelectedPosition([
			event.latlng.lat,
			event.latlng.lng,
		]);
	}

	function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
		const { name, value } = event.target;
		setFormData({ ...formData, [name]: value });
	}

	function handleSelectItem(itemId: number) {
		const alreadySelectedItem = selectedItems.findIndex((item) => item === itemId);
		if (alreadySelectedItem >= 0) {
			const filteredItems = selectedItems.filter((item) => item !== itemId);
			setSelectedItems(filteredItems);
		} else {
			setSelectedItems([...selectedItems, itemId]);
		}
	}

	async function handleSubmit(event: FormEvent) {
		event.preventDefault();

		const { name, email, whatsapp } = formData;
		const uf = selectedUF;
		const city = selectedCity;
		const [latitude, longitude] = selectedPosition;

		const data = new FormData();

		data.append('name', name);
		data.append('email', email);
		data.append('whatsapp', whatsapp);
		data.append('uf', uf);
		data.append('city', city);
		data.append('latitude', String(latitude));
		data.append('longitude', String(longitude));
		data.append('items', selectedItems.join(','));

		if (selectedFile) {
			data.append('image', selectedFile);
		}

		await api.post('points', data);

		setSuccessMessageVisibility(true);

		setTimeout(() => {
			history.push('/');
		}, 2000);
	}

	return (
		<div id="page-create-point">
			<header>
				<img src={logo} alt="Ecoleta" />

				<Link to="/">
					<FiArrowLeft />
					Voltar para Home
				</Link>
			</header>

			<form onSubmit={handleSubmit}>
				<h1>Cadastro do <br /> Ponto de Coleta</h1>

				<Dropzone onFileUploaded={setSelectedFile} />

				<fieldset>
					<legend>
						<h2>Dados</h2>
					</legend>

					<div className="field">
						<label htmlFor="name">Nome da entidade</label>
						<input
							type="text"
							name="name"
							id="name"
							onChange={handleInputChange}
						/>
					</div>
					<div className="field-group">
						<div className="field">
							<label htmlFor="email">E-mail</label>
							<input
								type="text"
								name="email"
								id="email"
								onChange={handleInputChange}
							/>
						</div>

						<div className="field">
							<label htmlFor="whatsapp">Whatsapp</label>
							<input
								type="text"
								name="whatsapp"
								id="whatsapp"
								onChange={handleInputChange}
							/>
						</div>
					</div>
				</fieldset>

				<fieldset>
					<legend>
						<h2>Endereço</h2>
						<span>Selecione o endereço no mapa</span>
					</legend>

					<Map center={initialPosition} zoom={15} onclick={handleMapClick}>
						<TileLayer
							attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
							url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
						/>
						<Marker position={selectedPosition} />
					</Map>

					<div className="field-group">
						<div className="field">
							<label htmlFor="uf">Estado (UF)</label>
							<select name="uf" id="uf" value={selectedUF} onChange={handleSelectUF}>
								<option value="0">Selecione uma UF</option>
								{ ufs.map((uf) => (
									<option key={uf} value={uf}>{uf}</option>
								))}
							</select>
						</div>

						<div className="field">
							<label htmlFor="city">Cidade</label>
							<select name="city" id="city" value={selectedCity} onChange={handleSelectCity}>
								<option value="0">Selecione uma cidade</option>
								{ citys.map((city) => (
									<option key={city} value={city}>{city}</option>
								))}
							</select>
						</div>
					</div>
				</fieldset>

				<fieldset>
					<legend>
						<h2>Ítems de Coleta</h2>
						<span>Selecione um ou mais ítems abaixo</span>
					</legend>

					<ul className="items-grid">
						{items.map((item) => (
							<li
								key={item.id}
								onClick={() => handleSelectItem(item.id)}
								className={selectedItems.includes(item.id) ? 'selected' : ''}
							>
								<img src={item.image_url} alt={item.title} />
								<span>{item.title}</span>
							</li>
						))}
					</ul>
				</fieldset>

				<button type="submit">
					Cadastra Ponto de Coleta
				</button>
			</form>
			<SuccessMessage message="Cadastro concluído!" visible={successMessageVisibility} />
		</div>
	);
};

export default CreatePoint;

