<?php

namespace WHMCS\Module\Gateway\Ezdefi;

class EzdefiAjax
{
	protected $db;

	protected $api;

	public function __construct()
	{
		$this->db = new EzdefiDb();
		$this->api = new EzdefiApi();
	}

	public function save_currency($data)
	{
		if(!isset($data['currency'])) {
			return $this->json_error_response();
		}

		$config = $data['currency'];

		if(!$this->validate_currency($config)) {
			return $this->json_error_response();
		};

		$save = $this->save_currency_config($config);

		if(!$save) {
			return $this->json_error_response();
		}

		return $this->json_success_response();
	}

	protected function validate_currency($config)
	{
		return (is_array($config) && !empty($config));
	}

	protected function save_currency_config($data)
	{
		try {
			$this->db->saveCurrency($data);
			return true;
		} catch (\Exception $e) {
			return false;
		}
	}

	public function get_token($data)
	{
		if(!$this->validate_token_data($data)) {
			return $this->json_error_response();
		};

		$api_url = $_POST['api_url'];
		$keyword = $_POST['keyword'];

		$api = new EzdefiApi($api_url);
		$token = $api->getToken($keyword);

		return json_encode($token);
	}

	protected function validate_token_data($data)
	{
		if(!isset($data['keyword']) || !isset($data['api_url'])) {
			return false;
		}

		$api_url = $_POST['api_url'];
		$keyword = $_POST['keyword'];

		if(empty($api_url) || empty($keyword)) {
			return false;
		}

		return true;
	}

	public function check_wallet($data)
	{
		if(!$this->validate_wallet_data($data)) {
			return 'false';
		}

		$address = $data['address'];
		$apiUrl = $data['apiUrl'];
		$apiKey = $data['apiKey'];

		$api = new EzdefiApi($apiUrl, $apiKey);

		$response = $api->getListWallet();

		$response = json_decode($response, true);

		$list_wallet = $response['data'];

		$key = array_search( $address, array_column( $list_wallet, 'address' ) );

		if($key !== false) {
			$status = $list_wallet[$key]['status'];

			if($status === 'ACTIVE') {
				return 'true';
			}
		}

		return 'false';
	}

	protected function validate_wallet_data($data)
	{
		if(!isset($data['address']) || !isset($data['apiUrl']) || !isset($data['apiKey'])) {
			return false;
		}

		return true;
	}

	public function create_payment($data)
	{
		if(!$this->validate_payment_data($data)) {
			return $this->json_error_response();
		}

		$uoid = $data['uoid'];
		$symbol = $data['symbol'];
		$method = $data['method'];

		$payment = $this->create_ezdefi_payment($uoid, $symbol, $method);

		if(!$payment) {
			return $this->json_error_response();
		}

		return $this->json_success_response($payment);
	}

	protected function validate_payment_data($data)
	{
		if(!isset($data['uoid']) || !isset($data['symbol']) || !isset($data['method'])) {
			return false;
		}

		$uoid = $data['uoid'];
		$symbol = $data['symbol'];
		$method = $data['method'];

		if(empty($uoid) || empty($symbol) || empty($method)) {
			return false;
		}

		return true;
	}

	public function create_ezdefi_payment($invoiceId, $symbol, $method)
	{
		$invoice = $this->db->getInvoice($invoiceId);

		$order_data = array(
			'amount' => $invoice->total,
			'uoid' => $invoiceId,
			'currency' => $this->db->getDefaultCurrency()
		);

		$currency_data = $this->db->getCurrencyBySymbol($symbol);

		$amount_id = ($method === 'amount_id') ? true : false;

		$payment = $this->api->createPayment($order_data, $currency_data, $amount_id);

		$payment = json_decode($payment, true);

		if($payment['code'] == -1 && isset($payment['error'])) {
			return false;
		}

		$payment = $payment['data'];

		if( $amount_id ) {
			$value = $payment['originValue'];
		} else {
			$value = $payment['value'] / pow( 10, $payment['decimal'] );
		}
		$value = rtrim(number_format($value, 12), '0');

		$data = array(
			'amount_id' => $value,
			'currency' => $symbol,
			'order_id' => substr($payment['uoid'], 0, strpos($payment['uoid'],'-' )),
			'status' => 'not_paid',
			'payment_method' => ($amount_id) ? 'amount_id' : 'ezdefi_wallet',
		);

		$this->db->add_exception($data);

		return $this->renderPaymentHtml($payment, $order_data);
	}

	protected function renderPaymentHtml($payment, $order_data)
	{
		$total = $order_data['amount'];
		$discount = $this->db->getCurrencyBySymbol( $payment['currency'] )['discount'];
		$total = $total - ( $total * ( $discount / 100 ) );
		ob_start(); ?>
		<div class="ezdefi-payment" data-paymentid="<?php echo $payment['_id']; ?>">
			<?php
                if((isset($payment['amountId']) && $payment['amountId'] === true)) {
                    $value = $payment['originValue'];
                } else {
                    $value = $payment['value'] / pow( 10, $payment['decimal']);
                }
                $value = rtrim(number_format($value, 12), '0') + 0;
            ?>
			<p class="exchange">
				<span><?php echo $payment['originCurrency']; ?> <?php echo $total; ?></span>
				<img width="16" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAQAAAAAYLlVAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAAmJLR0QAAKqNIzIAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAAHdElNRQfjChgQMyxZjA7+AAACP0lEQVRo3u2YvWsUQRTAf8nFQs5LCEY0aCGIB1ErRVMoFpYGTGNlo2AnBxHlrLQJKVSwiV//gqCV4gemEGJhiBYXRAtBDIhICiUGL8GP3Fjs7rs5vN0o5M1LsW+a2XkDv9/MvF12t4B2dDDODqbVOan46zgaVKzwN3A4O4VuarGAo8EZC4VeXnoKJruQK+QKa12hI2VyFyUFhY08Ymfcd1S49feU7VSZ5DPL4qrXGpxuhW/iJj8DgJutTrGJ38vHoPCobUnwg9QN8HeTItzGNP2yF7M85D11lTvhLAPSn2CYpah7R5zmOUmnChrgsrf6p6xPhvfRiAe/slsNnoqHcRketsDDbDw8ZYPvlsR5CzwMSGpICT+WhYdBSR4Ov3p9gbGV8Hr3PEAPx6XvPXZC7sBm3qSvPoRApJCB71KB+jHHERbab34YAZjLSuoW4T+EuYBNHJXC32W+A2taYAN9lgJFHjDZfGsNHUWe4XC8VVHwirD9hBLPZcpM+mN0NQTaHUGR+xySq3vpj1Gd8FfvuKjCyDiC5OyjdklpkSeE0N+aCLF6gNGY8IuCBb4zfklxzFjg4ZRQRi3wB/guB1AOjV9HhUXh3Ibo87zEYw7KpFqUWPUoUWaIrXL9gf18iRSeGPyamGdPYlI2wL/zflPQx4+g8CWu0tN6OiNBwL/5xAQjXhWQFCFc4IqMvOYY3xSKcIHlrPQ5z/UVvSr3wQqRK+QKuYIfVU9hSuGt+L924ZoFvqmgji+kZl6wSI2qtsAfm/EoPAbFFD0AAAAldEVYdGRhdGU6Y3JlYXRlADIwMTktMTAtMjRUMTY6NTE6NDQrMDA6MDBiAik3AAAAJXRFWHRkYXRlOm1vZGlmeQAyMDE5LTEwLTI0VDE2OjUxOjQ0KzAwOjAwE1+RiwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAAASUVORK5CYII=" />
				<span class="currency"><?php echo $value . ' ' . $payment['currency']; ?></span>
			</p>
			<p>You have <span class="count-down" data-endtime="<?php echo $payment['expiredTime']; ?>"></span> to scan this QR Code</p>
			<p>
				<a class="qrcode" href="<?php echo $payment['deepLink']; ?>">
					<img src="<?php echo $payment['qr']; ?>" />
				</a>
			</p>
			<?php if(isset( $payment['amountId'] ) && $payment['amountId'] == true) : ?>
                <p class="receive-address">
                    <strong>Address:</strong>
                    <span class="copy-to-clipboard" data-clipboard-text="<?php echo $payment['to']; ?>" title="Copy to clipboard">
                        <span class="copy-content"><?php echo $payment['to']; ?></span>
                        <img src="<?php echo $this->db->getSystemUrl() .  '/assets/img/copy-icon.svg'; ?>" />
                    </span>
                </p>
                <p class="payment-amount">
                    <strong>Amount:</strong>
                    <span class="copy-to-clipboard" data-clipboard-text="<?php echo $payment['originValue']; ?>" title="Copy to clipboard">
                        <span class="copy-content"><?php echo $payment['originValue']; ?></span>
                        <span class="amount"><?php echo $payment['token']['symbol'] ?></span>
                        <img src="<?php echo $this->db->getSystemUrl() . '/assets/img/copy-icon.svg'; ?>" />
                    </span>
                </p>
                <p class="note">You have to pay exact amount so that your order can be handle property.<br/></p>
                <p class="note">If you have difficulty for sending exact amount, try to use <a href="" class="ezdefiEnableBtn">ezDeFi Wallet</a></p>
			<?php else : ?>
                <p class="app-link-list">
                    <a href=""><img src="<?php echo $this->db->getSystemUrl() . '/assets/img/android-icon.png'; ?>" />Download ezDefi for IOS</a>
                    <a href=""><img src="<?php echo $this->db->getSystemUrl() . '/assets/img/ios-icon.png'; ?>" />Download ezDefi for Android</a>
                </p>
			<?php endif; ?>
		</div>
		<?php return ob_get_clean();
	}

	public function check_invoice($data)
	{
		if(!$this->validate_invoice_data($data)) {
			return;
		}

		$invoiceId = $data['invoice_id'];

		$status = $this->check_invoice_status($invoiceId);

		return $status;
	}

	protected function validate_invoice_data($data)
	{
		if(!isset($data['invoice_id'])) {
			return false;
		}

		$invoiceId = $data['invoice_id'];

		if(empty($invoiceId)) {
			return false;
		}

		return true;
	}

	protected function check_invoice_status($invoiceId)
	{
		return $this->db->getInvoiceStatus($invoiceId);
	}

	public function payment_timeout($data)
	{
		if(!$this->validate_payment_timeout_data($data)) {
			return;
		}

		$paymentid = $data['paymentid'];

		$this->set_amount_id_valid($paymentid);

		return;
	}

	protected function validate_payment_timeout_data($data)
	{
		if(!isset($data['paymentid'])) {
			return false;
		}

		$paymentid = $data['paymentid'];

		if(empty($paymentid)) {
			return false;
		}

		return true;
	}

	protected function set_amount_id_valid($paymentid)
	{
		$payment = $this->api->getPayment($paymentid);

		$payment = json_decode($payment, true);

		if($payment['code'] == -1 && isset($payment['error'])) {
			return;
		}

		$payment = $payment['data'];

		$this->db->set_amount_id_valid($payment['originValue'], $payment['currency']);
	}

	public function get_exceptions()
    {
	    $default = array(
		    'amount_id' => '',
		    'currency' => '',
		    'order_id' => '',
		    'clientid' => '',
		    'payment_method' => '',
		    'status' => ''
	    );

	    $params = array_merge($default, $_POST);

	    foreach($params as $column => $param) {
	        if(!in_array($column, array_keys($default))) {
	            unset($params[$column]);
            }
        }

	    $offset = 0;

	    $per_page = 9;

	    if(isset($_POST['page']) && $_POST['page'] > 1) {
		    $offset = $per_page * ($_POST['page'] - 1);
	    }

	    $current_page = (isset($_POST['page'])) ? $_POST['page'] : 1;

        $data = $this->db->get_exceptions($params, $offset, $per_page);

        if(empty($data['data'])) {
        	$current_page = $current_page - 1;
	        $offset = $per_page * ($current_page - 1);
        	$data = $this->db->get_exceptions($params, $offset, $per_page);
        }

	    $data['per_page'] = $per_page;
	    $data['current_page'] = $current_page;
	    $data['last_page'] = ceil($data['total'] / $per_page);

        return $this->json_success_response($data);
    }

    public function get_clients()
    {
        $clients = $this->db->get_clients();

        return $this->json_success_response($clients);
    }

    public function get_unpaid_invoices()
    {
	    $unpaid_invoices = $this->db->get_unpaid_invoices();

	    $currency = $this->db->getDefaultCurrency();

	    foreach($unpaid_invoices as $invoice) {
	        $invoice->date = date('Y/m/d', strtotime($invoice->date));
		    $invoice->duedate = date('Y/m/d', strtotime($invoice->duedate));
		    $invoice->suffix = $currency['suffix'];
		    $invoice->prefix = $currency['prefix'];
	    }

	    return $this->json_success_response($unpaid_invoices);
    }

	public function assign_amount_id($data)
	{
		if(!isset($data['amount_id']) || !isset($data['invoice_id']) || ! isset($data['currency'])) {
			return $this->json_error_response();
		}

		$amount_id = $data['amount_id'];

		$currency = $data['currency'];

		$old_invoice_id = ($data['old_invoice_id'] && !empty($data['old_invoice_id'])) ? $data['old_invoice_id'] : null;

		$invoice_id = $data['invoice_id'];

		$invoice = $this->db->get_invoice($invoice_id);

		if(!$invoice) {
			return $this->json_error_response($invoice_id);
		}

		$this->db->update_invoice_status($invoice_id, 'Paid');

		if(is_null($old_invoice_id)) {
			$this->db->delete_exceptions($amount_id, $currency, $old_invoice_id);
			$this->db->delete_exceptions_by_invoice_id($invoice_id);
		} else {
			$this->db->delete_exceptions_by_invoice_id($old_invoice_id);
		}

		return $this->json_success_response();
	}

	public function reverse_invoice($data)
	{
		if(!isset($data['amount_id']) || ! isset($data['invoice_id']) || !isset($data['currency'])) {
			return $this->json_error_response();
		}

		$amount_id = $data['amount_id'];

		$currency = $data['currency'];

		$invoice_id = $data['invoice_id'];

		$invoice = $this->db->get_invoice($invoice_id);

		if(!$invoice) {
			return $this->json_error_response();
		}

		$this->db->update_invoice_status($invoice_id, 'Unpaid');

		$wheres = array(
			'amount_id' => $amount_id,
			'currency' => $currency,
			'order_id' => $invoice_id,
			'status' => 'done'
		);

		$data = array(
			'order_id' => null,
			'status' => null,
			'payment_method' => null
		);

		$this->db->update_exception( $wheres, $data );

		return $this->json_success_response();
	}

	public function delete_exception($data)
	{
		$amount_id = $data['amount_id'];

		$order_id = (!empty($data['invoice_id'])) ? $data['invoice_id'] : null;

		$currency = $data['currency'];

		$this->db->delete_exceptions($amount_id, $currency, $order_id);
	}

	protected function json_response($code = 200, $data = '') {
		header_remove();
		http_response_code($code);
		header("Cache-Control: no-transform,public,max-age=300,s-maxage=900");
		header('Content-Type: application/json');
		$status = array(
			200 => '200 OK',
			400 => '400 Bad Request'
		);

		header('Status: '.$status[$code]);

		if($code < 300) {
			return json_encode(array(
				'status' => 200,
				'data' => $data
			));
		}

		return json_encode(array(
			'status' => 400,
			'message' => $data
		));
	}

	protected function json_success_response($data = '') {
		return $this->json_response(200, $data);
	}

	protected function json_error_response($data = '') {
		return $this->json_response(400, $data);
	}
}