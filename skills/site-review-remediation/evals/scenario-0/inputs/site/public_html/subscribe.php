<?php
header('Content-Type: application/json');
$input = json_decode(file_get_contents('php://input'), true);
$email = trim($input['email']);
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) { http_response_code(400); exit; }
$list = file_exists('subscribers.txt') ? file('subscribers.txt', FILE_IGNORE_NEW_LINES) : [];
if (in_array($email, $list)) { http_response_code(409); exit; }
$list[] = $email;
file_put_contents('subscribers.txt', implode("\n", $list));
echo json_encode(['ok' => true]);
