// simulate getting products from DataBase
const products = [
	{ sku: 10001, name: 'Apples', country: 'Italy', cost: 5, instock: 10 },
	{ sku: 10002, name: 'Oranges', country: 'Spain', cost: 4, instock: 3 },
	{ sku: 10003, name: 'Beans', country: 'USA', cost: 2, instock: 5 },
	{ sku: 10004, name: 'Cabbage', country: 'USA', cost: 1, instock: 8 },
];
//=========Cart=============
const Cart = (props) => {
	const { Card, Accordion, Button } = ReactBootstrap;
	let data = props.location.data ? props.location.data : products;
	console.log(`data:${JSON.stringify(data)}`);

	return <Accordion defaultActiveKey='0'>{list}</Accordion>;
};

const useDataApi = (initialUrl, initialData) => {
	const { useState, useEffect, useReducer } = React;
	const [url, setUrl] = useState(initialUrl);

	const [state, dispatch] = useReducer(dataFetchReducer, {
		isLoading: false,
		isError: false,
		data: initialData,
	});
	console.log(`useDataApi called`);
	useEffect(() => {
		console.log('useEffect Called');
		let didCancel = false;
		const fetchData = async () => {
			dispatch({ type: 'FETCH_INIT' });
			try {
				const result = await axios(url);
				console.log('FETCH FROM URl');
				if (!didCancel) {
					dispatch({ type: 'FETCH_SUCCESS', payload: result.data });
				}
			} catch (error) {
				if (!didCancel) {
					dispatch({ type: 'FETCH_FAILURE' });
				}
			}
		};
		fetchData();
		return () => {
			didCancel = true;
		};
	}, [url]);
	return [state, setUrl];
};
const dataFetchReducer = (state, action) => {
	switch (action.type) {
		case 'FETCH_INIT':
			return {
				...state,
				isLoading: true,
				isError: false,
			};
		case 'FETCH_SUCCESS':
			return {
				...state,
				isLoading: false,
				isError: false,
				data: action.payload,
			};
		case 'FETCH_FAILURE':
			return {
				...state,
				isLoading: false,
				isError: true,
			};
		default:
			throw new Error();
	}
};

const Products = (props) => {
	const [items, setItems] = React.useState(products);
	const [cart, setCart] = React.useState([]);
	const [total, setTotal] = React.useState(0);
	const { Card, Accordion, Button, Container, Row, Col, Image, Input } =
		ReactBootstrap;
	//  Fetch Data
	const { Fragment, useState, useEffect, useReducer } = React;
	const [query, setQuery] = useState('http://localhost:1337/products');
	const [{ data, isLoading, isError }, doFetch] = useDataApi(
		'http://localhost:1337/products',
		{
			data: [],
		}
	);
	console.log(`Rendering Products ${JSON.stringify(data)}`);
	// Fetch Data
	const addToCart = (e) => {
		let sku = e.target.name;
		let item = items.filter((item) => item.sku == sku);
		if (item[0].instock == 0) return;
		item[0].instock = item[0].instock - 1;
		console.log(`Existing Cart ${JSON.stringify(cart)}`);
		console.log(`add item to Cart ${JSON.stringify(item)}`);
		//setCart([...cart, ...item]);
		// First check if the item already is there in cart then increase the quantity 
		let found = false;
		if (item.length > 0) { 
			for (const [i, val] of cart.entries()) {
				if (cart[i].sku === item[0].sku) {
					cart[i].quantity++;
					found = true;
					break;
				}
			}
		}

		// if the item to be added is not already in the cart then add i
		if (!found) {
			cart.push({ sku: item[0].sku, name: item[0].name, cost: item[0].cost, quantity: 1 });
		}
		setCart([...cart]);

		//doFetch(query);
	};

	const deleteCartItem = (delIndex) => {
		// this is the index in the cart not in the Product List

		let newCart = cart.filter((item, i) => delIndex != i);
		let target = cart.filter((item, index) => delIndex == index);
		let newItems = items.map((item, index) => {
			if (item.sku == target[0].sku) item.instock = item.instock + 1;
			return item;
		} );
		// Reduce the quantity of the deleted item
		target[0].quantity--;
		if ( target[0].quantity > 0 ) {
			newCart = [...newCart,...target]
		}
		setCart(newCart);
		setItems(newItems);
	};
	const photos = ['apple.png', 'orange.png', 'beans.png', 'cabbage.png'];

	let list = items.map((item, index) => {
		let n = index + 1049;
		//let url = "https://picsum.photos/id/" + n + "/50/50";
		let uhit = 'https://picsum.photos/' + n;
		let buttonStyle = {
			padding: 4,
			margin: 4,
			display: 'inline-block',
		};
		return (
			<li key={index}>
				<Image src={uhit} width={50} roundedCircle></Image>
				{/* <Image src={photos[index % 4]} width={70} roundedCircle></Image> */}
				<Button style={buttonStyle} variant='primary' size='meduim'>
					{item.sku}:{item.name}:${item.cost}:{item.instock}
				</Button>
				<input name={item.sku} type='submit' onClick={addToCart}></input>
			</li>
		);
	});

	let cartList = cart.map((item, index) => {
		return (
			<Card key={index}>
				<Card.Header>
					<Accordion.Toggle as={Button} variant='link' eventKey={1 + index}>
						{item.sku}({item.name}):Quantity={item.quantity}
					</Accordion.Toggle>
				</Card.Header>
				<Accordion.Collapse
					onClick={() => deleteCartItem(index)}
					eventKey={1 + index}>
					<Card.Body>
						$ {item.cost} from {item.country}
					</Card.Body>
				</Accordion.Collapse>
			</Card>
		);
	});

	let finalList = () => {
		let total = checkOut();
		let final = cart.map((item, index) => {
			return (
				<div key={index} index={index}>
					{item.sku}({item.name})
				</div>
			);
		});
		return { final, total };
	};

	const checkOut = () => {
		let costs = cart.map((item) => item.cost*item.quantity);
		const reducer = (accum, current) => accum + current;
		let newTotal = costs.reduce(reducer, 0);
		console.log(`total updated to ${newTotal}`);
		return newTotal;
	};
	const restockProducts = (url) => {
		console.log('in restock');
		doFetch(url);
		let newItems = data.map((item) => {
			let { sku, name, country, cost, instock } = item;
			return { sku, name, country, cost, instock };
		});
		// original code
		//setItems([...items, ...newItems]);
		//New code to check product based on sku and then add quantity else add product
		newItems.forEach((nitem) => {
			let found = false;
			let index = -1;
			for (const [i, val] of items.entries()) {
				if (items[i].sku === nitem.sku) {
					found = true;
					index = i;
					break;
				}
			}
			if (found) {
				items[index].instock = items[index].instock + nitem.instock;
			} else {
				items.push(nitem);
			}
		});
		console.log(items);
		setItems([...items]);
	};
	let h2Style = {
		textAlign: 'center',
	};
	return (
		<Container>
			<Row>
				<Col>
					<h2 style={h2Style}>Product List</h2>
					<ul style={{ listStyleType: 'none' }}>{list}</ul>
				</Col>
				<Col>
					<h2 style={h2Style}>Cart Contents</h2>
					<Accordion>{cartList}</Accordion>
				</Col>
				<Col>
					<h2 style={h2Style}>CheckOut </h2>
					<Button onClick={checkOut}>CheckOut $ {finalList().total}</Button>
					<div> {finalList().total > 0 && finalList().final} </div>
				</Col>
			</Row>
			<Row>
				<form
					onSubmit={(event) => {
						console.log('calling Restock ');
						restockProducts(`${query}`);
						console.log(`Restock called on ${query}`);
						event.preventDefault();
					}}>
					<input
						type='text'
						value={query}
						onChange={(event) => setQuery(event.target.value)}
					/>
					<button type='submit'>ReStock Products</button>
				</form>
			</Row>
		</Container>
	);
};
// ========================================
ReactDOM.render(<Products />, document.getElementById('root'));
